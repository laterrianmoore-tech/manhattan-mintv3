import Stripe from "stripe";
import { supabaseAdmin } from "./supabase";
import { isPlaceholderEmail } from "./arrival-window";
import { publicSiteUrl } from "./referral";
import { TAX_CODE, taxAddressFor } from "./stripe-tax";

// Auto-invoicing for invoice-pay clients (2026-10-20). Scoped to the
// INVOICE_PAY_CUSTOMERS allow-list below — nobody else is ever auto-invoiced.
//
// Why: Rebecca and Melissa (every 3 weeks) have a Stripe customer but no card,
// so Job Complete used to end in "AUTO-CHARGE FAILED, collect manually" and the
// owner ran a one-off script per visit (scripts/melissa-invoice-1010.mjs,
// scripts/rebecca-invoice-and-rebook-1009.mjs). This does what those scripts
// did, from the cleaner's tap: a finalized Stripe invoice tagged with the
// booking id (the ledger in stripe-accounting.ts already picks paid invoices
// up by that tag), plus a setup-mode Checkout link so the customer can put a
// card on file — owner rule: every invoice also collects a card.
//
// Delivery is the caller's job (one SMS via sendSms); this file only talks to
// Stripe and, when it has to mint a Stripe customer, stamps the id back onto
// the customer + booking rows so later visits find it.
//
// Idempotent: the booking id is the key. An existing non-void invoice is
// reused (finalized if still a draft), and Stripe idempotency keys guard the
// create calls against a double tap in flight.

const API_VERSION = "2026-02-25.clover" as const;
const INVOICE_DAYS_UNTIL_DUE = 7;

// Who gets auto-invoiced (owner decision 2026-10-20): ONLY these Stripe
// customers. Every other booking with no card, or a failed charge, keeps the
// "collect manually" warning to the owner — no invoice, no customer text.
// Add a Stripe customer id here when the owner moves another client to
// invoice-pay; nothing else needs to change.
export const INVOICE_PAY_CUSTOMERS: ReadonlySet<string> = new Set([
  "cus_VHf09DTP8VsLYB", // Rebecca — every 3 weeks, $100
  "cus_VGGZu3qsWnINYM", // Melissa — every 3 weeks, $95
]);

export function isInvoicePayCustomer(stripeCustomerId: string | null | undefined): boolean {
  return !!stripeCustomerId && INVOICE_PAY_CUSTOMERS.has(stripeCustomerId);
}

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: API_VERSION }) : null;
}

function siteUrl(): string {
  // NEXT_PUBLIC_SITE_URL is localhost in .env.local; a customer-facing link
  // must never be. publicSiteUrl falls back to the production domain.
  return publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
}

export type InvoiceCustomer = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  apt_no?: string | null;
  stripe_customer_id?: string | null;
};

export type BookingInvoiceInput = {
  bookingId: string;
  customer: InvoiceCustomer;
  /** Booking's stripe_customer_id, if any; the customer row's id is the fallback. */
  stripeCustomerId?: string | null;
  /** Price in dollars, before tax. */
  amountDollars: number;
  serviceDate: string; // YYYY-MM-DD
  summary: string; // "1 BR / 1 BA"
  /** Tax on top through Stripe Tax, the same rule the hold/charge use. */
  taxable: boolean;
  /** Plan only: no Stripe writes, no DB writes. */
  dryRun?: boolean;
};

export type BookingInvoiceResult =
  | {
      ok: true;
      dryRun: boolean;
      /** True when an invoice for this booking already existed and was reused. */
      existing: boolean;
      invoiceId: string | null;
      number: string | null;
      status: string | null;
      /** Dollars, tax included. */
      amount: number;
      taxCents: number;
      hostedUrl: string | null;
      stripeCustomerId: string | null;
      /** True when the Stripe customer was created by this call (or would be, in a dry run). */
      customerCreated: boolean;
      hasCard: boolean;
      /** Setup-mode Checkout link when there is no card on file. */
      cardLink: string | null;
      /** True when Stripe emailed the invoice (real email only). */
      emailed: boolean;
      /** Why no email went out, or why tax was skipped. */
      notes: string[];
    }
  | { ok: false; error: string };

/** A customer email we can actually send to: present and not a placeholder. */
export function hasRealEmail(email: string | null | undefined): boolean {
  const e = String(email ?? "").trim();
  return e.includes("@") && !isPlaceholderEmail(e);
}

function fmtDate(serviceDate: string): string {
  return new Date(serviceDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "Standard clean - 1 BR / 1 BA - Sat Oct 31, 2026" */
export function invoiceDescription(summary: string, serviceDate: string): string {
  return `Standard clean - ${summary || "cleaning"} - ${fmtDate(serviceDate)}`;
}

/** Default payment method, else the newest attached card (setup-link cards never become the default). */
export async function hasCardOnFile(stripeCustomerId: string | null | undefined): Promise<boolean> {
  const stripe = client();
  if (!stripe || !stripeCustomerId) return false;
  try {
    const c = await stripe.customers.retrieve(stripeCustomerId);
    if (c.deleted) return false;
    if ((c as Stripe.Customer).invoice_settings?.default_payment_method) return true;
    const pms = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: "card", limit: 1 });
    return pms.data.length > 0;
  } catch (e) {
    console.error("[stripe-invoice] card lookup failed:", stripeCustomerId, (e as Error)?.message);
    return false;
  }
}

/** The newest non-void invoice tagged with this booking, if any. */
export async function findBookingInvoice(stripe: Stripe, bookingId: string, stripeCustomerId?: string | null): Promise<Stripe.Invoice | null> {
  const live = (i: Stripe.Invoice) => i.metadata?.supabase_booking_id === bookingId && !["void", "deleted"].includes(String(i.status));
  // The customer's recent list is read-after-write consistent; search can lag a few seconds.
  if (stripeCustomerId) {
    const recent = await stripe.invoices.list({ customer: stripeCustomerId, limit: 25 });
    const hit = recent.data.find(live);
    if (hit) return hit;
  }
  const found = await stripe.invoices.search({ query: `metadata["supabase_booking_id"]:"${bookingId}"`, limit: 5 });
  return found.data.find(live) ?? null;
}

/** Setup-mode Checkout link: saves a card, charges nothing. Same shape as scripts/card-on-file.mjs. */
export async function createCardSetupLink(stripeCustomerId: string): Promise<string | null> {
  const stripe = client();
  if (!stripe) return null;
  try {
    const s = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      success_url: `${siteUrl()}/thank-you?card=saved`,
      cancel_url: `${siteUrl()}/thank-you`,
    });
    return s.url ?? null;
  } catch (e) {
    console.error("[stripe-invoice] card setup link failed:", stripeCustomerId, (e as Error)?.message);
    return null;
  }
}

// Mint a Stripe customer for a booking that has none, and stamp the id back
// onto the customer + booking rows. Reuses a Stripe customer that already
// carries the same real email (card-on-file.mjs may have created one).
async function ensureStripeCustomer(stripe: Stripe, input: BookingInvoiceInput): Promise<{ id: string; created: boolean }> {
  const existing = input.stripeCustomerId || input.customer.stripe_customer_id;
  if (existing) return { id: existing, created: false };
  const c = input.customer;
  const email = hasRealEmail(c.email) ? String(c.email).trim() : undefined;
  let id: string | null = null;
  if (email) {
    const found = await stripe.customers.list({ email, limit: 1 });
    id = found.data[0]?.id ?? null;
  }
  if (!id) {
    const addr = taxAddressFor(c.address, c.apt_no);
    const created = await stripe.customers.create(
      {
        name: [c.first_name, c.last_name].filter((s) => s && !/pending/i.test(String(s))).join(" ").trim() || undefined,
        email,
        phone: c.phone || undefined,
        address: { line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postal_code: addr.postal_code, country: addr.country },
        metadata: { supabase_customer_id: c.id, source: "job_complete_auto_invoice" },
      },
      { idempotencyKey: `cus-${c.id}` },
    );
    id = created.id;
  }
  await supabaseAdmin.from("customers").update({ stripe_customer_id: id }).eq("id", c.id);
  await supabaseAdmin.from("bookings").update({ stripe_customer_id: id }).eq("id", input.bookingId);
  return { id, created: true };
}

// Stripe Tax on an invoice needs a customer address. Fill it from the booking
// when the Stripe customer has none (NYC zip assumed the same way the hold's
// tax quote does it).
async function ensureCustomerAddress(stripe: Stripe, stripeCustomerId: string, c: InvoiceCustomer): Promise<void> {
  const cus = await stripe.customers.retrieve(stripeCustomerId);
  if (cus.deleted) return;
  if ((cus as Stripe.Customer).address?.postal_code) return;
  const addr = taxAddressFor(c.address, c.apt_no);
  await stripe.customers.update(stripeCustomerId, {
    address: { line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, postal_code: addr.postal_code, country: addr.country },
  });
}

function summarize(inv: Stripe.Invoice): { number: string | null; status: string | null; amount: number; taxCents: number; hostedUrl: string | null } {
  const taxCents = ((inv as unknown as { total_taxes?: { amount?: number }[] }).total_taxes ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
  return {
    number: inv.number ?? null,
    status: inv.status ?? null,
    amount: (inv.total ?? inv.amount_due) / 100,
    taxCents,
    hostedUrl: inv.hosted_invoice_url ?? null,
  };
}

/**
 * Create (or reuse) the invoice for a booking, finalize it, email it when the
 * customer has a real email, and mint a card-on-file link when they have no
 * card. Never throws: a failure comes back as { ok: false, error } so Job
 * Complete can fall back to the collect-manually warning.
 */
export async function createBookingInvoice(input: BookingInvoiceInput): Promise<BookingInvoiceResult> {
  const stripe = client();
  if (!stripe) return { ok: false, error: "Missing STRIPE_SECRET_KEY" };
  if (!input.bookingId) return { ok: false, error: "bookingId is required" };
  if (!input.amountDollars || input.amountDollars <= 0) return { ok: false, error: "a positive amount is required" };
  const dryRun = !!input.dryRun;
  const notes: string[] = [];
  const c = input.customer;
  const realEmail = hasRealEmail(c.email);
  const description = invoiceDescription(input.summary, input.serviceDate);
  const amountCents = Math.round(input.amountDollars * 100);

  try {
    // ── Customer ──
    const knownCustomerId = input.stripeCustomerId || c.stripe_customer_id || null;
    let stripeCustomerId = knownCustomerId;
    let customerCreated = false;
    if (!stripeCustomerId && dryRun) {
      customerCreated = true;
    } else if (!stripeCustomerId) {
      const ensured = await ensureStripeCustomer(stripe, input);
      stripeCustomerId = ensured.id;
      customerCreated = ensured.created;
    }

    // ── Existing invoice (idempotency) ──
    let inv = stripeCustomerId && !customerCreated ? await findBookingInvoice(stripe, input.bookingId, stripeCustomerId) : null;
    let existing = !!inv;
    const hasCard = stripeCustomerId && !customerCreated ? await hasCardOnFile(stripeCustomerId) : false;

    if (!inv && dryRun) {
      // Plan only. Tax is reported as "Stripe Tax would apply" rather than
      // quoted, because the quote lives on the invoice Stripe computes.
      if (input.taxable) notes.push("taxable booking: Stripe Tax would be added on top (automatic_tax)");
      if (!realEmail) notes.push("no real email: Stripe email skipped, link goes by text only");
      if (!hasCard) notes.push("no card on file: card setup link would be minted");
      return {
        ok: true,
        dryRun: true,
        existing: false,
        invoiceId: null,
        number: null,
        status: "would-create",
        amount: input.amountDollars,
        taxCents: 0,
        hostedUrl: null,
        stripeCustomerId,
        customerCreated,
        hasCard,
        cardLink: hasCard ? null : "<card setup link>",
        emailed: false,
        notes: [`description: ${description}`, `metadata.supabase_booking_id: ${input.bookingId}`, ...notes],
      };
    }

    // ── Create + add the line + finalize ──
    if (!inv) {
      const sid = stripeCustomerId as string;
      let withTax = input.taxable;
      if (withTax) {
        try {
          await ensureCustomerAddress(stripe, sid, c);
        } catch (e) {
          console.error("[stripe-invoice] customer address not set, invoicing without tax:", (e as Error)?.message);
          notes.push(`tax not applied: ${(e as Error)?.message}`);
          withTax = false;
        }
      }
      const base: Stripe.InvoiceCreateParams = {
        customer: sid,
        collection_method: "send_invoice",
        days_until_due: INVOICE_DAYS_UNTIL_DUE,
        auto_advance: true,
        description,
        pending_invoice_items_behavior: "exclude",
        metadata: { supabase_booking_id: input.bookingId, kind: "job_complete_auto_invoice", service_date: input.serviceDate },
      };
      try {
        inv = await stripe.invoices.create(
          withTax ? { ...base, automatic_tax: { enabled: true } } : base,
          { idempotencyKey: `inv-${input.bookingId}${withTax ? "-tax" : ""}` },
        );
      } catch (e) {
        if (!withTax) throw e;
        // Stripe Tax refused (address it can't resolve, etc.): bill without
        // tax rather than leave the owner collecting by hand.
        console.error("[stripe-invoice] automatic tax refused, invoicing without tax:", (e as Error)?.message);
        notes.push(`tax not applied: ${(e as Error)?.message}`);
        withTax = false;
        inv = await stripe.invoices.create(base, { idempotencyKey: `inv-${input.bookingId}` });
      }
      await stripe.invoiceItems.create(
        {
          customer: sid,
          invoice: inv.id,
          amount: amountCents,
          currency: "usd",
          description,
          ...(withTax ? { tax_code: TAX_CODE, tax_behavior: "exclusive" as const } : {}),
        },
        { idempotencyKey: `invitem-${inv.id}` },
      );
      existing = false;
    }

    if (inv.status === "draft") {
      inv = await stripe.invoices.finalizeInvoice(inv.id, { auto_advance: true });
    }

    // ── Card-on-file link (owner rule: every invoice also collects a card) ──
    const cardLink = hasCard ? null : await createCardSetupLink(stripeCustomerId as string);
    if (!hasCard && !cardLink) notes.push("card setup link could not be created");

    // ── Email via Stripe, real addresses only ──
    let emailed = false;
    if (!realEmail) {
      notes.push("placeholder/no email: Stripe email skipped");
    } else if (inv.status !== "open") {
      notes.push(`invoice is ${inv.status}: no email sent`);
    } else if (inv.metadata?.emailed_at) {
      emailed = true;
      notes.push(`already emailed ${inv.metadata.emailed_at}`);
    } else {
      try {
        // The Stripe customer may predate the real email (placeholder era).
        const cus = await stripe.customers.retrieve(stripeCustomerId as string);
        if (!cus.deleted && !(cus as Stripe.Customer).email) {
          await stripe.customers.update(stripeCustomerId as string, { email: String(c.email).trim() });
        }
        await stripe.invoices.sendInvoice(inv.id);
        await stripe.invoices.update(inv.id, { metadata: { ...inv.metadata, emailed_at: new Date().toISOString() } });
        emailed = true;
      } catch (e) {
        console.error("[stripe-invoice] email send failed:", inv.id, (e as Error)?.message);
        notes.push(`Stripe email failed: ${(e as Error)?.message}`);
      }
    }

    const s = summarize(inv);
    return {
      ok: true,
      dryRun: false,
      existing,
      invoiceId: inv.id,
      number: s.number,
      status: s.status,
      amount: s.amount,
      taxCents: s.taxCents,
      hostedUrl: s.hostedUrl,
      stripeCustomerId,
      customerCreated,
      hasCard,
      cardLink,
      emailed,
      notes,
    };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    console.error("[stripe-invoice] failed:", input.bookingId, err?.code, err?.message);
    return { ok: false, error: err?.message || "Invoice creation failed" };
  }
}

/** The one text the customer gets: invoice link + (when there is no card) the card-on-file link. */
export function invoiceSmsBody(opts: { firstName: string; amount: number; hostedUrl: string; cardLink: string | null }): string {
  const amt = Number.isInteger(opts.amount) ? `$${opts.amount}` : `$${opts.amount.toFixed(2)}`;
  const card = opts.cardLink
    ? ` To make future cleans hands-off, save a card on file here (30 seconds, no charge now) so they bill automatically: ${opts.cardLink}`
    : "";
  return `Hi ${opts.firstName} — thank you for having Manhattan Mint today! Here's your invoice for this clean (${amt}), payable by card right from the link: ${opts.hostedUrl}${card} — Manhattan Mint NYC`;
}
