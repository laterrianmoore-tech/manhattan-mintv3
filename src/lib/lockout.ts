import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "./supabase";
import { sendSms } from "./openphone";
import { chargeCustomer } from "./stripe-charge";
import { captureHold, inspectHold, releaseHold } from "./stripe-hold";
import { recordCollection } from "./stripe-accounting";
import { isTaxableBooking, quoteTax, recordTaxTransaction, taxMetadata, type TaxQuote } from "./stripe-tax";
import { lockoutUrl } from "./manage-token";
import { publicSiteUrl } from "./referral";

// Lockout flow (2026-10-28).
//
// On 2026-10-28 a cleaner arrived, could not get in, and the customer ignored
// two calls and texts. The owner handled it by hand: a 10-minute final
// warning, then a "we've released your cleaner, $119 lockout fee applied"
// text and email. This module is that sequence as code.
//
//   1. Cleaner taps "Can't get in" (after "Arrived") → /api/job-event
//      event "locked_out": locked_out_at is stamped, the customer gets the
//      final warning, the owner gets "🚪 LOCKOUT …" with a signed link.
//   2. Owner resolves it from /admin/dispatch or that link (/lockout/):
//        let_in  — customer opened up; the job carries on as normal.
//        charge  — release the cleaner, capture exactly the $119 fee from
//                  the card hold (plus NY sales tax only on taxable
//                  bookings), the rest of the hold goes back to the card;
//                  customer is texted + emailed with an invitation to rebook.
//        waive   — release the cleaner, release the whole hold, text the
//                  customer the no-fee version.
//      Charge and waive set status = 'lockout'. The cleaner's pay on the job
//      is never touched: she gave up the slot, so the job still shows in
//      /admin/accounting and the payout list exactly as dispatched.
//
// Every customer-facing text opens "Hi <name>, this is Manhattan Mint Luxury
// Cleaning." and signs the same way. Never "Lee", never "small team".

export const LOCKOUT_FEE_DOLLARS = 119;
export const LOCKOUT_GRACE_MINUTES = 10;
const PHONE_DISPLAY = "(914) 863-7902";
const PHONE_E164 = "+19148637902";
const SIGNATURE = "Manhattan Mint Luxury Cleaning";

export type LockoutAction = "let_in" | "charge" | "waive";

type CustomerRow = {
  id?: string;
  first_name: string;
  last_name?: string | null;
  address?: string | null;
  apt_no?: string | null;
  phone?: string | null;
  email?: string | null;
  stripe_customer_id?: string | null;
};

type BookingRow = {
  id: string;
  customer_id: string;
  status: string;
  service_date: string;
  service_summary?: string | null;
  frequency?: string | null;
  pricing_total?: number | null;
  created_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  locked_out_at?: string | null;
  lockout_resolved_at?: string | null;
  lockout_resolution?: string | null;
  lockout_fee_cents?: number | null;
  stripe_charge_id?: string | null;
  stripe_customer_id?: string | null;
  assigned_cleaner_id?: string | null;
  second_cleaner_id?: string | null;
  customers: CustomerRow;
};

export function siteUrl(): string {
  return publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
}

export function ownerPhones(): string[] {
  return (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
}

export function fmtMoney(dollars: number): string {
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

function fmtTimeNy(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}

function fmtDateLong(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function fullAddress(c: CustomerRow): string {
  return [String(c.address ?? "").trim(), c.apt_no ? `Apt ${String(c.apt_no).trim()}` : ""].filter(Boolean).join(" ");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Message wording (print these for the owner before changing them) ───────

/** Final warning, sent the moment the cleaner taps "Can't get in". */
export function lockoutWarningSms(o: { firstName: string; cleanerName: string }): string {
  return (
    `Hi ${o.firstName}, this is ${SIGNATURE}. ${o.cleanerName} is at your door for today's clean and hasn't been able to get in — ` +
    `we've called and texted. Could you let ${o.cleanerName} in within the next ${LOCKOUT_GRACE_MINUTES} minutes, or tell us how to get in (doorman, lockbox, a neighbor)? ` +
    `If we don't hear back, we'll have to release your cleaner for today and the $${LOCKOUT_FEE_DOLLARS} lockout fee in our terms will be charged to your card on file. ` +
    `We'd much rather do the clean — just reply here or call ${PHONE_DISPLAY}. — ${SIGNATURE}`
  );
}

/** Owner alert with the signed resolution link. */
export function lockoutOwnerSms(o: { customerName: string; address: string; cleanerName: string; lockedOutAt: string; url: string }): string {
  return (
    `🚪 LOCKOUT ${o.customerName} ${o.address} — ${o.cleanerName} can't get in. ` +
    `Customer texted the ${LOCKOUT_GRACE_MINUTES}-minute warning at ${fmtTimeNy(o.lockedOutAt)}, timer started. ` +
    `Resolve (let in / charge $${LOCKOUT_FEE_DOLLARS} / waive): ${o.url}`
  );
}

/** Released + fee applied. `taxDollars` > 0 only on taxable (new-customer) bookings. */
export function lockoutChargedSms(o: { firstName: string; cleanerName: string; taxDollars: number; remainderReleased: boolean; bookUrl: string }): string {
  const fee = o.taxDollars > 0 ? `$${LOCKOUT_FEE_DOLLARS} lockout fee plus ${fmtMoney(o.taxDollars)} NY sales tax` : `$${LOCKOUT_FEE_DOLLARS} lockout fee`;
  return (
    `Hi ${o.firstName}, this is ${SIGNATURE}. We weren't able to reach you and ${o.cleanerName} couldn't get in, so we've released your cleaner for today. ` +
    `Per our terms, the ${fee} has been charged to your card on file` +
    (o.remainderReleased ? `, and the rest of today's hold has been released back to your card. ` : `. `) +
    `We'd still love to get your home cleaned — reply here with a day that works, or book a new time at ${o.bookUrl}. — ${SIGNATURE}`
  );
}

/** Released, no fee. */
export function lockoutWaivedSms(o: { firstName: string; cleanerName: string; holdReleased: boolean; bookUrl: string }): string {
  return (
    `Hi ${o.firstName}, this is ${SIGNATURE}. We weren't able to reach you and ${o.cleanerName} couldn't get in, so we've released your cleaner for today. ` +
    `No charge this time` +
    (o.holdReleased ? ` — the hold on your card has been released. ` : `. `) +
    `We'd still love to get your home cleaned — reply here with a day that works, or book a new time at ${o.bookUrl}. — ${SIGNATURE}`
  );
}

/** Tells the cleaner she can leave. Pay is never mentioned in a text after dispatch. */
export function lockoutCleanerReleaseSms(o: { cleanerName: string; customerFirst: string; address: string }): string {
  return `Hi ${o.cleanerName} — ${o.customerFirst} didn't open up, so you're released from today's job at ${o.address}. Thank you for waiting; head home. — Manhattan Mint`;
}

/** Matching email for the charged outcome (same shell as the reminder email: transactional, no unsubscribe). */
export function renderLockoutEmail(o: {
  firstName: string;
  cleanerName: string;
  dateLabel: string;
  address: string;
  taxDollars: number;
  cardLabel: string | null;
  remainderReleased: boolean;
  bookUrl: string;
  termsUrl: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const GREEN_DARK = "#1e4d38";
  const GREEN = "#2d6a4f";
  const GREEN_BRIGHT = "#1d9e75";
  const INK = "#141414";
  const BODY = "#4a4a44";
  const CREAM = "#f4f1ea";
  const CARD = "#faf8f4";
  const SERIF = "Georgia,'Times New Roman',serif";
  const SANS = "'DM Sans',Helvetica,Arial,sans-serif";
  const MAILING_ADDRESS = "Manhattan Mint NYC LLC · 401 E 34th St, New York, NY 10016";

  const total = LOCKOUT_FEE_DOLLARS + o.taxDollars;
  const feeLine = o.taxDollars > 0 ? `$${LOCKOUT_FEE_DOLLARS} + ${fmtMoney(o.taxDollars)} NY sales tax = ${fmtMoney(total)}` : `$${LOCKOUT_FEE_DOLLARS}`;
  const subject = `Today's clean: lockout fee applied`;
  const preheader = `We couldn't get in today. The $${LOCKOUT_FEE_DOLLARS} lockout fee in our terms has been applied; let's find a new time.`;

  const row = (label: string, value: string, last = false) => `
  <tr>
    <td style="padding:13px 0;${last ? "" : `border-bottom:1px solid #eeeae1;`}">
      <p style="margin:0;color:#9a9a92;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">${label}</p>
      <p style="margin:4px 0 0;color:${INK};font-family:${SANS};font-size:16px;line-height:1.45;">${value}</p>
    </td>
  </tr>`;

  const rows = [
    row("When", escapeHtml(o.dateLabel)),
    row("Where", escapeHtml(o.address)),
    row("Lockout fee", feeLine),
    row("Charged to", o.cardLabel ? escapeHtml(o.cardLabel) : "Your card on file", true),
  ].join("");

  const bodyHtml = `
  <p style="margin:0 0 14px;color:${GREEN_BRIGHT};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Today's clean</p>
  <h2 style="margin:0 0 14px;color:${INK};font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;">We couldn't get in today</h2>
  <p style="margin:0 0 18px;color:${BODY};font-family:${SANS};font-size:16px;line-height:1.65;">Hi ${escapeHtml(o.firstName)} — ${escapeHtml(o.cleanerName)} arrived for your clean today and wasn't able to get in. We called and texted, and gave it ${LOCKOUT_GRACE_MINUTES} more minutes before releasing your cleaner for the day.</p>
  <p style="margin:0 0 26px;color:${BODY};font-family:${SANS};font-size:16px;line-height:1.65;">Per <a href="${o.termsUrl}" style="color:${GREEN};font-weight:600;text-decoration:none;">our terms</a>, a cleaner who can't get in at the time of the cleaning means a $${LOCKOUT_FEE_DOLLARS} lockout fee. It has been applied to your card on file${o.remainderReleased ? ", and the rest of today's hold has been released back to your card" : ""}.</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;padding:6px 22px;background:${CARD};border-radius:12px;border-left:3px solid ${GREEN_BRIGHT};">
    ${rows}
  </table>

  <p style="margin:0 0 18px;color:${BODY};font-family:${SANS};font-size:15px;line-height:1.7;"><strong style="color:${INK};">We'd still love to clean your home.</strong> Reply to this email with a day that works, or book a new time below. If there's a doorman, lockbox or neighbor who can let us in next time, tell us and we'll put it on the job.</p>

  <p style="margin:0 0 22px;">
    <a href="${o.bookUrl}" style="display:inline-block;background:${GREEN_BRIGHT};color:#ffffff;font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px;">Book a new time</a>
  </p>

  <p style="margin:0 0 6px;color:${BODY};font-family:${SANS};font-size:15px;line-height:1.7;">Think this was a mix-up on our side? Reply here or text <a href="tel:${PHONE_E164}" style="color:${GREEN};font-weight:600;text-decoration:none;">${PHONE_DISPLAY}</a> and a person will sort it out.</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:36px 12px 48px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="padding:0 8px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <a href="${o.siteUrl}" style="text-decoration:none;">
                <span style="color:${GREEN_DARK};font-family:${SERIF};font-size:24px;letter-spacing:-.01em;">Manhattan&nbsp;Mint</span>
              </a>
            </td>
            <td align="right">
              <span style="color:#8a867c;font-family:${SANS};font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Luxury Cleaning</span>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(30,50,40,.07);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:5px;background:${GREEN_DARK};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:42px 44px 36px;">
              ${bodyHtml}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:26px 8px 0;text-align:center;">
          <p style="margin:0 0 10px;">
            <a href="tel:${PHONE_E164}" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">${PHONE_DISPLAY}</a>
            <span style="color:#c9c4b8;">&nbsp;·&nbsp;</span>
            <a href="${o.siteUrl}" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">manhattanmintnyc.com</a>
          </p>
          <p style="margin:0 0 6px;color:#a39e92;font-family:${SANS};font-size:12px;">Questions? Just reply — a real person reads this inbox.</p>
          <p style="margin:0 0 6px;color:#b6b1a5;font-family:${SANS};font-size:11px;">${MAILING_ADDRESS}</p>
          <p style="margin:0;color:#b6b1a5;font-family:${SANS};font-size:11px;">You're getting this because you had a cleaning scheduled with us today.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${o.firstName} — ${o.cleanerName} arrived for your clean today (${o.dateLabel}, ${o.address}) and wasn't able to get in. We called and texted, and gave it ${LOCKOUT_GRACE_MINUTES} more minutes before releasing your cleaner for the day.`,
    ``,
    `Per our terms (${o.termsUrl}), a cleaner who can't get in at the time of the cleaning means a $${LOCKOUT_FEE_DOLLARS} lockout fee. It has been applied to your card on file${o.remainderReleased ? ", and the rest of today's hold has been released back to your card" : ""}.`,
    `Lockout fee: ${feeLine}`,
    ``,
    `We'd still love to clean your home. Reply with a day that works, or book a new time: ${o.bookUrl}`,
    `If there's a doorman, lockbox or neighbor who can let us in next time, tell us and we'll put it on the job.`,
    ``,
    `Think this was a mix-up on our side? Reply here or text ${PHONE_DISPLAY}.`,
    ``,
    `— ${SIGNATURE}`,
  ].join("\n");

  return { subject, html, text };
}

// ── Loading ───────────────────────────────────────────────────────────────

export async function loadLockoutBooking(bookingId: string): Promise<{ booking: BookingRow; cleanerName: string; cleaners: { id: string; first_name: string; phone: string | null }[] } | null> {
  const { data: b } = await supabaseAdmin.from("bookings").select("*, customers(*)").eq("id", bookingId).single();
  if (!b) return null;
  const ids = [b.assigned_cleaner_id, b.second_cleaner_id].filter((x): x is string => !!x);
  let cleaners: { id: string; first_name: string; phone: string | null }[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin.from("cleaners").select("id, first_name, phone").in("id", ids);
    cleaners = (data ?? []) as typeof cleaners;
  }
  const primary = cleaners.find((c) => c.id === b.assigned_cleaner_id);
  return { booking: b as BookingRow, cleanerName: primary?.first_name ?? "Your cleaner", cleaners };
}

/** True once the lockout columns exist. Lets the UI hide the button on an unmigrated database. */
export function lockoutColumnsPresent(booking: object): boolean {
  return "locked_out_at" in booking;
}

export function isOpenLockout(b: { locked_out_at?: string | null; lockout_resolved_at?: string | null }): boolean {
  return !!b.locked_out_at && !b.lockout_resolved_at;
}

// ── Resolution ─────────────────────────────────────────────────────────────

export type ResolveResult = {
  ok: boolean;
  error?: string;
  action: LockoutAction;
  dryRun: boolean;
  alreadyResolved?: boolean;
  /** Owner-facing one-liner for the UI / owner text. */
  summary: string;
  feeDollars: number;
  taxDollars: number;
  totalDollars: number;
  taxable: boolean;
  customerSms?: string;
  cleanerSms?: string;
  ownerSms?: string;
  email?: { to: string | null; subject: string; text: string; html: string } | null;
};

/**
 * Apply the owner's decision. `dryRun` computes every text and the email
 * without writing, charging or sending — the preview the owner approves.
 */
export async function resolveLockout(opts: { bookingId: string; action: LockoutAction; dryRun?: boolean }): Promise<ResolveResult> {
  const { action } = opts;
  const dryRun = !!opts.dryRun;
  const base = { action, dryRun, feeDollars: 0, taxDollars: 0, totalDollars: 0, taxable: false };
  const loaded = await loadLockoutBooking(opts.bookingId);
  if (!loaded) return { ...base, ok: false, error: "Booking not found", summary: "Booking not found" };
  const { booking, cleanerName, cleaners } = loaded;
  const customer = booking.customers;
  // A dry run previews the wording on any booking, migrated or not; a real
  // resolution needs the columns and an actual "Can't get in" tap.
  if (!dryRun && !lockoutColumnsPresent(booking)) {
    return { ...base, ok: false, error: "Lockout columns missing — run lib/supabase/migrations/2026-10-28-lockout.sql", summary: "Database not migrated" };
  }
  if (!dryRun && !booking.locked_out_at) {
    return { ...base, ok: false, error: "This job was never marked as a lockout.", summary: "No lockout on this job" };
  }
  if (booking.lockout_resolved_at && !dryRun) {
    const what = booking.lockout_resolution === "let_in" ? "customer let the cleaner in" : booking.lockout_resolution === "charged" ? `fee charged` : "fee waived";
    return { ...base, ok: true, alreadyResolved: true, summary: `Already resolved at ${fmtTimeNy(booking.lockout_resolved_at)} (${what}).` };
  }
  if (!dryRun && (booking.completed_at || booking.status === "completed")) {
    return { ...base, ok: false, error: "This job is already completed.", summary: "Already completed" };
  }
  if (!dryRun && booking.status === "cancelled") {
    return { ...base, ok: false, error: "This job is cancelled.", summary: "Cancelled" };
  }

  const now = new Date().toISOString();
  const site = siteUrl();
  const bookUrl = `${site}/quote/`;
  const termsUrl = `${site}/terms/`;
  const customerName = `${customer.first_name} ${customer.last_name || ""}`.trim();
  const address = fullAddress(customer) || "(no address)";
  const stripeCustomerId = booking.stripe_customer_id || customer.stripe_customer_id || null;

  // ── Let in: timer off, job continues ────────────────────────────────
  if (action === "let_in") {
    const summary = `${customer.first_name} let ${cleanerName} in — lockout cleared, job continues.`;
    if (dryRun) return { ...base, ok: true, summary };
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ lockout_resolved_at: now, lockout_resolution: "let_in" })
      .eq("id", booking.id);
    if (error) return { ...base, ok: false, error: error.message, summary: "Could not save" };
    return { ...base, ok: true, summary };
  }

  // ── Waive: release everything, no charge ─────────────────────────────
  if (action === "waive") {
    const hold = booking.stripe_charge_id ? await inspectHold(booking.stripe_charge_id) : { state: "none" as const };
    const willRelease = hold.state === "held";
    const customerSms = lockoutWaivedSms({ firstName: customer.first_name, cleanerName, holdReleased: willRelease, bookUrl });
    const cleanerSms = lockoutCleanerReleaseSms({ cleanerName, customerFirst: customer.first_name, address });
    const summary = `🚪 Lockout at ${customerName}: cleaner released, fee WAIVED.${willRelease ? ` $${hold.amount} hold released.` : ""} Customer texted. ${cleanerName}'s pay stays on the job.`;
    if (dryRun) return { ...base, ok: true, summary, customerSms, cleanerSms, ownerSms: summary, email: null };

    const released = await releaseHold(booking.stripe_charge_id);
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "lockout",
        lockout_resolved_at: now,
        lockout_resolution: "waived",
        lockout_fee_cents: 0,
        collected_cents: 0,
        stripe_fee_cents: 0,
        collected_at: now,
        collected_ref: "lockout fee waived",
        ...(released.released ? { stripe_charge_id: null } : {}),
      })
      .eq("id", booking.id);
    if (error) return { ...base, ok: false, error: error.message, summary: "Could not save" };

    await notifyAll({ booking, customer, cleaners, customerSms, cleanerSms, ownerSms: summary });
    return { ...base, ok: true, summary, customerSms, cleanerSms, ownerSms: summary, email: null };
  }

  // ── Charge: capture exactly the fee from the hold ────────────────────
  const fee = LOCKOUT_FEE_DOLLARS;
  const taxable = await isTaxableBooking({ customerId: booking.customer_id, createdAt: booking.created_at });
  const tax: TaxQuote | null = taxable
    ? await quoteTax({ amountDollars: fee, address: customer.address, aptNo: customer.apt_no, reference: `${booking.id}-lockout` })
    : null;
  const taxDollars = tax ? tax.taxCents / 100 : 0;
  const total = Math.round((fee + taxDollars) * 100) / 100;
  // Rewrites whatever tax keys the hold was placed with: accounting nets
  // tax_cents out of amount_captured, and the hold's own tax was on the full
  // clean, not on the fee.
  const feeMeta: Record<string, string> = {
    kind: "lockout_fee",
    lockout_fee_cents: String(fee * 100),
    supabase_booking_id: booking.id,
    tax_cents: "",
    tax_calculation_id: "",
    tax_rate_pct: "",
    ...(tax ? taxMetadata(tax) : {}),
  };

  const hold = booking.stripe_charge_id ? await inspectHold(booking.stripe_charge_id) : { state: "none" as const };
  const remainderWillRelease = hold.state === "held" && hold.amount > total;
  const customerSms = lockoutChargedSms({ firstName: customer.first_name, cleanerName, taxDollars, remainderReleased: remainderWillRelease, bookUrl });
  const cleanerSms = lockoutCleanerReleaseSms({ cleanerName, customerFirst: customer.first_name, address });
  const cardLabel = await cardLabelFor(stripeCustomerId);
  const email = renderLockoutEmail({
    firstName: customer.first_name,
    cleanerName,
    dateLabel: fmtDateLong(booking.service_date),
    address,
    taxDollars,
    cardLabel,
    remainderReleased: remainderWillRelease,
    bookUrl,
    termsUrl,
    siteUrl: site,
  });
  const taxNote = tax && tax.taxCents > 0 ? ` + ${fmtMoney(taxDollars)} tax` : tax?.error ? ` (⚠️ tax not calculated: ${tax.error})` : "";

  if (dryRun) {
    const plan =
      hold.state === "held"
        ? `capture $${fee}${taxNote} of the $${hold.amount} hold${remainderWillRelease ? `, release the other ${fmtMoney(hold.amount - total)}` : ""}${hold.amount < total ? `, charge the remaining ${fmtMoney(total - hold.amount)} separately` : ""}`
        : hold.state === "captured"
          ? `charge nothing more (the $${hold.amount} hold was already captured)`
          : stripeCustomerId
            ? `charge ${fmtMoney(total)} to the card on file (no live hold)`
            : `have to collect the fee by hand (NO CARD ON FILE)`;
    return {
      ...base,
      ok: true,
      summary: `Would ${plan}. Customer texted + emailed. ${cleanerName}'s pay stays on the job.`,
      feeDollars: fee,
      taxDollars,
      totalDollars: total,
      taxable,
      customerSms,
      cleanerSms,
      ownerSms: `🚪 Lockout at ${customerName}: cleaner released, $${fee} fee — ${plan}.`,
      email: { to: customer.email ?? null, ...email },
    };
  }

  // Money first, then the row, then the texts — a failed charge still
  // resolves the lockout, but the owner is told to collect by hand.
  let chargeLine = "";
  let paidPaymentIntentId: string | null = null;
  let newChargeId: string | null = null;
  let needFresh = false;
  let freshAmount = total;
  if (hold.state === "held") {
    const cap = await captureHold({ paymentIntentId: hold.paymentIntentId, amount: total, metadata: feeMeta });
    if (cap.ok) {
      paidPaymentIntentId = cap.paymentIntentId;
      chargeLine = `💳 $${cap.captured} captured from the $${hold.amount} hold${remainderWillRelease ? `; ${fmtMoney(hold.amount - cap.captured)} released back to the card` : ""}.`;
      if (cap.shortfall > 0) {
        needFresh = true;
        freshAmount = cap.shortfall;
      }
    } else if (cap.gone) {
      needFresh = true;
    } else {
      chargeLine = `⚠️ HOLD CAPTURE FAILED (${fmtMoney(total)}): ${cap.error} — collect the fee by hand.`;
    }
  } else if (hold.state === "captured") {
    chargeLine = `Payment: hold was already captured ($${hold.amount}) — nothing more charged.`;
  } else {
    needFresh = true;
  }
  if (needFresh) {
    if (!stripeCustomerId) {
      chargeLine = `${chargeLine} ⚠️ NO CARD ON FILE — collect the ${fmtMoney(freshAmount)} fee by hand.`.trim();
    } else {
      const charge = await chargeCustomer({
        stripeCustomerId,
        amount: freshAmount,
        description: `Manhattan Mint lockout fee — ${booking.service_date}`,
        metadata: freshAmount === total ? feeMeta : { kind: "lockout_fee", supabase_booking_id: booking.id },
      });
      if (charge.ok) {
        if (freshAmount === total) {
          paidPaymentIntentId = charge.paymentIntentId;
          newChargeId = charge.paymentIntentId;
        }
        chargeLine = `${chargeLine} 💳 ${fmtMoney(charge.amount)} charged to the card on file.`.trim();
      } else {
        chargeLine = `${chargeLine} ⚠️ CHARGE FAILED (${fmtMoney(freshAmount)}): ${charge.error} — collect the fee by hand.`.trim();
      }
    }
  }
  if (tax && tax.taxCents > 0 && paidPaymentIntentId) {
    const txId = await recordTaxTransaction(tax.calculationId, `${paidPaymentIntentId}-lockout`);
    if (!txId) chargeLine += " ⚠️ Tax transaction not recorded in Stripe Tax.";
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "lockout",
      lockout_resolved_at: now,
      lockout_resolution: "charged",
      lockout_fee_cents: fee * 100,
      ...(newChargeId ? { stripe_charge_id: newChargeId } : {}),
    })
    .eq("id", booking.id);
  if (error) return { ...base, ok: false, error: `${error.message} (${chargeLine})`, summary: "Could not save" };

  // Ledger: collected_cents = what the fee PaymentIntent captured, net of tax.
  await recordCollection(booking.id);

  const ownerSms = `🚪 Lockout at ${customerName}: cleaner released, $${fee} fee${taxNote}. ${chargeLine} Customer texted${customer.email ? " + emailed" : ""}. ${cleanerName}'s pay stays on the job.`;
  const emailed = await sendLockoutEmail(customer.email ?? null, email);
  await notifyAll({ booking, customer, cleaners, customerSms, cleanerSms, ownerSms: emailed.ok ? ownerSms : `${ownerSms} ⚠️ Email did not send (${emailed.error}).` });
  return {
    ...base,
    ok: true,
    summary: `${chargeLine} Customer texted${emailed.ok ? " + emailed" : ""}.`,
    feeDollars: fee,
    taxDollars,
    totalDollars: total,
    taxable,
    customerSms,
    cleanerSms,
    ownerSms,
    email: { to: customer.email ?? null, ...email },
  };
}

async function cardLabelFor(stripeCustomerId: string | null): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !stripeCustomerId) return null;
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
    const pms = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: "card", limit: 1 });
    const card = pms.data[0]?.card;
    return card ? `${card.brand.replace(/^\w/, (c) => c.toUpperCase())} ending in ${card.last4}` : null;
  } catch {
    return null;
  }
}

async function sendLockoutEmail(to: string | null, email: { subject: string; html: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  if (!to) return { ok: false, error: "customer has no email" };
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false, error: "SendGrid not configured" };
  const ownerCopy = (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || "").split(",").map((a) => a.trim()).filter(Boolean);
  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to,
      ...(ownerCopy.length ? { bcc: ownerCopy } : {}),
      from: { email: from, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { ok: true };
  } catch (e) {
    const err = e as { message?: string; response?: { body?: unknown } };
    console.error("[lockout] email failed:", err?.message, err?.response?.body);
    return { ok: false, error: err?.message || "send failed" };
  }
}

async function notifyAll(o: {
  booking: BookingRow;
  customer: CustomerRow;
  cleaners: { id: string; first_name: string; phone: string | null }[];
  customerSms: string;
  cleanerSms: string;
  ownerSms: string;
}) {
  const primaryId = o.booking.assigned_cleaner_id ?? null;
  if (o.customer.phone) {
    await sendSms({ to: o.customer.phone, body: o.customerSms, cleanerId: primaryId, bookingId: o.booking.id, recipientType: "customer", eventType: "cancelled" });
  }
  for (const c of o.cleaners) {
    if (!c.phone) continue;
    await sendSms({
      to: c.phone,
      body: lockoutCleanerReleaseSms({ cleanerName: c.first_name, customerFirst: o.customer.first_name, address: fullAddress(o.customer) || "today's address" }),
      cleanerId: c.id,
      bookingId: o.booking.id,
      recipientType: "cleaner",
      eventType: "cancelled",
    });
  }
  for (const to of ownerPhones()) {
    await sendSms({ to, body: o.ownerSms, cleanerId: primaryId, bookingId: o.booking.id, recipientType: "customer", eventType: "other" });
  }
}

/** Owner text + signed link for a fresh lockout (used by /api/job-event). */
export function lockoutAlertFor(o: { bookingId: string; customerName: string; address: string; cleanerName: string; lockedOutAt: string }): { url: string; sms: string } {
  const url = lockoutUrl(o.bookingId, siteUrl());
  return { url, sms: lockoutOwnerSms({ ...o, url }) };
}
