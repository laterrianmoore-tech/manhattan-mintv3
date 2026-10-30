import { supabaseAdmin } from "./supabase";

// Broker referral partners (2026-10-30). A real estate broker sends clients
// through a dedicated code and link (/quote/?code=OSUR). The code gives the
// client nothing off; it records who made the introduction. Both fees are
// ONCE PER CLIENT (owner 2026-10-30): feePerJob when a client the broker
// introduced completes their first paid clean, and feeRecurring the first
// time that client completes a visit on a recurring plan (the same visit, if
// their first clean is on a plan: $40 + $75 = $115). Later visits earn
// nothing. Fees are paid Fridays by Zelle/Venmo: the Thursday payroll text
// lists them and /admin/partners stamps them paid.
//
// Attribution is two-layered. bookings.broker_code is the booking that came
// through the link. customers.broker_code marks a NEW client as the broker's,
// so every later visit (auto-created recurring, keep-my-cleaner, a phone
// booking the owner keys in) counts without anyone remembering to tag it.
//
// The database side is lib/supabase/migrations/2026-10-30-broker-partners.sql.
// Until it has run, partners resolve from SEED_PARTNERS below so the quote
// banner still works, and the writes log and skip instead of failing a booking.

export type BrokerPartner = {
  code: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  payoutHandle: string | null;
  payoutMethod: "zelle" | "venmo" | null;
  feePerJob: number;
  feeRecurring: number;
  active: boolean;
};

// Code shape lives in broker-code.ts (no server imports) so the quote page can
// check it in the browser; re-exported here for server callers.
export { BROKER_CODE_RE, looksLikeBrokerCode, normalizeBrokerCode } from "./broker-code";
import { normalizeBrokerCode, looksLikeBrokerCode } from "./broker-code";

// Mirrors the seed rows in the migration. The database wins once it exists;
// this list only keeps the banner and the link working before it does.
export const SEED_PARTNERS: BrokerPartner[] = [
  {
    code: "OSUR",
    name: "The Osur Team",
    contactName: "Brandon Kalusa",
    contactEmail: "brandon@livingny.com",
    payoutHandle: null,
    payoutMethod: null,
    feePerJob: 40,
    feeRecurring: 75,
    active: true,
  },
];

type PartnerRow = {
  code: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  payout_handle: string | null;
  payout_method: string | null;
  fee_per_job: number | null;
  fee_recurring: number | null;
  active: boolean | null;
};

function fromRow(r: PartnerRow): BrokerPartner {
  return {
    code: r.code,
    name: r.name,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    payoutHandle: r.payout_handle,
    payoutMethod: r.payout_method === "zelle" || r.payout_method === "venmo" ? r.payout_method : null,
    feePerJob: Number(r.fee_per_job ?? 40),
    feeRecurring: Number(r.fee_recurring ?? 75),
    active: r.active !== false,
  };
}

/** All partners, database first, seed list when the table isn't there yet. */
export async function listBrokerPartners(): Promise<{ partners: BrokerPartner[]; source: "db" | "seed"; error: string | null }> {
  const { data, error } = await supabaseAdmin.from("broker_partners").select("*").order("created_at", { ascending: true });
  if (error) return { partners: SEED_PARTNERS, source: "seed", error: error.message };
  const partners = ((data ?? []) as PartnerRow[]).map(fromRow);
  for (const s of SEED_PARTNERS) if (!partners.some((p) => p.code === s.code)) partners.push(s);
  return { partners, source: "db", error: null };
}

/** One partner by code, or null. Inactive partners resolve to null so their link stops attributing. */
export async function getBrokerPartner(code: string | null | undefined): Promise<BrokerPartner | null> {
  const c = normalizeBrokerCode(code);
  if (!looksLikeBrokerCode(c)) return null;
  const { partners } = await listBrokerPartners();
  const p = partners.find((x) => x.code === c) ?? null;
  return p && p.active ? p : null;
}

/** Record a visit to /quote/ with a broker code. Never throws. */
export async function logBrokerClick(code: string, meta: { referrer?: string | null; userAgent?: string | null }): Promise<boolean> {
  const { error } = await supabaseAdmin.from("broker_link_clicks").insert({
    code: normalizeBrokerCode(code),
    referrer: meta.referrer?.slice(0, 500) || null,
    user_agent: meta.userAgent?.slice(0, 300) || null,
  });
  if (error) console.error("[brokers] click not logged (run migrations/2026-10-30-broker-partners.sql):", error.message);
  return !error;
}

export function isRecurringFrequency(frequency: string | null | undefined): boolean {
  const f = String(frequency ?? "").toLowerCase();
  return Boolean(f) && !/one/.test(f);
}

// ── Stats ──────────────────────────────────────────────────────────────────

export type BrokerJobRow = {
  id: string;
  customer_id: string;
  service_date: string;
  status: string;
  frequency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  service_summary: string | null;
  collected_cents: number | null;
  pricing_total: number | null;
  completed_at: string | null;
  broker_code: string | null;
  broker_fee_paid_at: string | null;
  broker_fee_ref: string | null;
  customers: { first_name?: string | null; last_name?: string | null; broker_code?: string | null } | null;
};

export type BrokerJob = {
  bookingId: string;
  customerId: string;
  date: string;
  client: string; // "Jane D."
  apartment: string; // "2 BR / 1 BA"
  status: "booked" | "in_progress" | "completed" | "awaiting_payment" | "lockout";
  statusLabel: string;
  recurring: boolean;
  /** Fee this job earns: feePerJob on the client's first completed paid clean, feeRecurring on their first completed recurring visit; 0 after both are used. */
  fee: number;
  firstClean: boolean;
  recurringBonus: boolean;
  feePaidAt: string | null;
  feeRef: string | null;
};

export type BrokerStats = {
  partner: BrokerPartner;
  clicks: number;
  bookings: number; // every non-cancelled booking by a referred client
  completed: number; // completed cleans (paid or not)
  newClients: number; // clients whose first-clean fee has been earned
  recurringConversions: number; // clients whose recurring bonus has been earned
  feesEarned: number;
  feesPaid: number;
  feesOwed: number;
  jobs: BrokerJob[]; // newest first
  dbReady: boolean;
};

export function apartmentLabel(r: Pick<BrokerJobRow, "bedrooms" | "bathrooms" | "service_summary">): string {
  if (r.service_summary) return r.service_summary.replace(/\s*\(\+?\$[\d,.]+\)/g, "");
  if (r.bedrooms != null && r.bathrooms != null) return `${r.bedrooms} BR / ${r.bathrooms} BA`;
  return "Apartment clean";
}

export function clientLabel(c: BrokerJobRow["customers"]): string {
  const first = (c?.first_name ?? "").trim();
  const last = (c?.last_name ?? "").trim();
  return `${first || "Client"}${/^[A-Za-z]/.test(last) ? ` ${last[0].toUpperCase()}.` : ""}`;
}

/** Pure: fee math from the attributed bookings, so it can be checked without a database. */
export function computeBrokerStats(partner: BrokerPartner, rows: BrokerJobRow[], clicks: number, dbReady = true): BrokerStats {
  const live = rows.filter((r) => r.status !== "cancelled");
  // Oldest first so "the client's first completed recurring visit" is found in order.
  const ordered = [...live].sort((a, b) => (a.service_date < b.service_date ? -1 : a.service_date > b.service_date ? 1 : a.id < b.id ? -1 : 1));
  const firstGiven = new Set<string>();
  const bonusGiven = new Set<string>();
  const jobs: BrokerJob[] = [];
  for (const r of ordered) {
    const paid = Number(r.collected_cents ?? 0) > 0;
    const recurring = isRecurringFrequency(r.frequency);
    let status: BrokerJob["status"];
    if (r.status === "completed") status = paid ? "completed" : "awaiting_payment";
    else if (r.status === "in_progress") status = "in_progress";
    else if (r.status === "lockout") status = "lockout";
    else status = "booked";
    let fee = 0;
    let firstClean = false;
    let recurringBonus = false;
    if (status === "completed") {
      if (!firstGiven.has(r.customer_id)) {
        firstGiven.add(r.customer_id);
        fee += partner.feePerJob;
        firstClean = true;
      }
      if (recurring && !bonusGiven.has(r.customer_id)) {
        bonusGiven.add(r.customer_id);
        fee += partner.feeRecurring;
        recurringBonus = true;
      }
    }
    jobs.push({
      bookingId: r.id,
      customerId: r.customer_id,
      date: r.service_date,
      client: clientLabel(r.customers),
      apartment: apartmentLabel(r),
      status,
      statusLabel:
        status === "completed" ? "Completed" : status === "awaiting_payment" ? "Completed, payment pending" : status === "in_progress" ? "In progress" : status === "lockout" ? "Lockout, no fee" : "Booked",
      recurring,
      fee,
      firstClean,
      recurringBonus,
      feePaidAt: r.broker_fee_paid_at,
      feeRef: r.broker_fee_ref,
    });
  }
  const feesEarned = jobs.reduce((s, j) => s + j.fee, 0);
  const feesPaid = jobs.reduce((s, j) => s + (j.feePaidAt ? j.fee : 0), 0);
  return {
    partner,
    clicks,
    bookings: live.length,
    completed: live.filter((r) => r.status === "completed").length,
    newClients: firstGiven.size,
    recurringConversions: bonusGiven.size,
    feesEarned,
    feesPaid,
    feesOwed: feesEarned - feesPaid,
    jobs: jobs.reverse(),
    dbReady,
  };
}

const JOB_COLUMNS = "id, customer_id, service_date, status, frequency, bedrooms, bathrooms, service_summary, collected_cents, pricing_total, completed_at, broker_code, broker_fee_paid_at, broker_fee_ref, customers(first_name, last_name, broker_code)";

/** Every booking attributed to a partner: through the link, or by a client the partner introduced. */
export async function brokerJobRows(code: string): Promise<{ rows: BrokerJobRow[]; error: string | null }> {
  const c = normalizeBrokerCode(code);
  const [viaBooking, viaCustomer] = await Promise.all([
    supabaseAdmin.from("bookings").select(JOB_COLUMNS).eq("broker_code", c),
    supabaseAdmin.from("bookings").select(JOB_COLUMNS.replace("customers(", "customers!inner(")).eq("customers.broker_code", c),
  ]);
  const error = viaBooking.error?.message ?? viaCustomer.error?.message ?? null;
  const byId = new Map<string, BrokerJobRow>();
  for (const r of [...((viaBooking.data ?? []) as unknown as BrokerJobRow[]), ...((viaCustomer.data ?? []) as unknown as BrokerJobRow[])]) byId.set(r.id, r);
  return { rows: [...byId.values()], error };
}

export async function brokerClickCount(code: string): Promise<number> {
  const { count, error } = await supabaseAdmin.from("broker_link_clicks").select("id", { count: "exact", head: true }).eq("code", normalizeBrokerCode(code));
  if (error) return 0;
  return count ?? 0;
}

export async function brokerStatsFor(partner: BrokerPartner): Promise<BrokerStats> {
  const [{ rows, error }, clicks] = await Promise.all([brokerJobRows(partner.code), brokerClickCount(partner.code)]);
  if (error) console.error("[brokers] stats incomplete (run migrations/2026-10-30-broker-partners.sql):", error);
  return computeBrokerStats(partner, rows, clicks, !error);
}

// ── Attribution writes (all tolerant of the migration not having run) ──────

/** Stamp the booking that came through the link. */
export async function attributeBooking(bookingId: string, code: string): Promise<void> {
  const { error } = await supabaseAdmin.from("bookings").update({ broker_code: normalizeBrokerCode(code) }).eq("id", bookingId);
  if (error) console.error("[brokers] booking not attributed (run migrations/2026-10-30-broker-partners.sql):", error.message);
}

/**
 * Mark a client as the broker's. Only a NEW client counts as an introduction:
 * someone who had already booked with us before this booking is not re-attributed,
 * and a client already tied to a broker keeps that broker.
 */
export async function attributeCustomer(customerId: string, code: string, excludeBookingId?: string): Promise<"attributed" | "existing_client" | "already" | "error"> {
  const { data: customer, error: readErr } = await supabaseAdmin.from("customers").select("id, broker_code").eq("id", customerId).single();
  if (readErr || !customer) {
    console.error("[brokers] customer not attributed:", readErr?.message ?? "not found");
    return "error";
  }
  if (customer.broker_code) return "already";
  let prior = supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", customerId).neq("status", "cancelled");
  if (excludeBookingId) prior = prior.neq("id", excludeBookingId);
  const { count } = await prior;
  if ((count ?? 0) > 0) return "existing_client";
  const { error } = await supabaseAdmin.from("customers").update({ broker_code: normalizeBrokerCode(code) }).eq("id", customerId);
  if (error) {
    console.error("[brokers] customer not attributed:", error.message);
    return "error";
  }
  return "attributed";
}

// ── Payout ─────────────────────────────────────────────────────────────────

export type BrokerPayout = {
  code: string;
  name: string;
  payoutHandle: string | null;
  payoutMethod: "zelle" | "venmo" | null;
  total: number;
  jobs: Array<{ bookingId: string; date: string; client: string; amount: number; firstClean: boolean; recurringBonus: boolean }>;
};

/** What each partner is owed right now: earned fees with no paid-at stamp. */
export async function brokerFeesOwed(): Promise<{ payouts: BrokerPayout[]; error: string | null }> {
  const { partners, error: listErr } = await listBrokerPartners();
  if (listErr) return { payouts: [], error: listErr };
  const payouts: BrokerPayout[] = [];
  let error: string | null = null;
  for (const p of partners) {
    if (!p.active) continue;
    const { rows, error: rowsErr } = await brokerJobRows(p.code);
    if (rowsErr) {
      error = rowsErr;
      continue;
    }
    const stats = computeBrokerStats(p, rows, 0);
    const owed = stats.jobs.filter((j) => j.fee > 0 && !j.feePaidAt).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (!owed.length) continue;
    payouts.push({
      code: p.code,
      name: p.name,
      payoutHandle: p.payoutHandle,
      payoutMethod: p.payoutMethod,
      total: owed.reduce((s, j) => s + j.fee, 0),
      jobs: owed.map((j) => ({ bookingId: j.bookingId, date: j.date, client: j.client, amount: j.fee, firstClean: j.firstClean, recurringBonus: j.recurringBonus })),
    });
  }
  return { payouts, error };
}
