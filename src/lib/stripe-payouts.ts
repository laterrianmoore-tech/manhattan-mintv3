import Stripe from "stripe";
import { supabaseAdmin } from "./supabase";

// Cleaner payouts, matched from Stripe automatically (2026-10-09).
//
// The owner pays cleaners by transferring from the Stripe balance to each
// cleaner's Connect account (cleaners.stripe_account_id). He asked that
// recording the payment never be a separate step: once the transfer exists in
// Stripe, the job is paid. So this walks every transfer since the ledger's
// settled-through date and applies it, oldest first, to that cleaner's unpaid
// completed jobs. A job is stamped paid only when a transfer (plus any credit
// left from earlier transfers) fully covers its pay; the transfer id is the
// payout reference. Short transfers leave the job owed and the shortfall
// visible, which is how a mistake surfaces instead of disappearing.
//
// Runs on every /admin/accounting load and in the daily cron. Never throws.

const API_VERSION = "2026-02-25.clover" as const;

/** Everything on or before this was squared up by the 10/1 payout run (see backfill script). */
export const PAYOUT_MATCH_SINCE = "2026-10-02T00:00:00Z";

/** Transfers to this account are the owner moving revenue to the business bank, not cleaner pay. */
export const OWNER_DRAW_ACCOUNT = "acct_1U13Fd6SVZmeJJQr";

type Job = {
  id: string;
  service_date: string;
  completed_at: string | null;
  assigned_cleaner_id: string | null;
  second_cleaner_id: string | null;
  cleaner_pay: number | null;
  cleaner_paid_at: string | null;
  second_cleaner_pay: number | null;
  second_cleaner_paid_at: string | null;
};

export type Transfer = { id: string; created: string; amount: number; destination: string };

export type ReconcileResult = {
  ok: boolean;
  stamped: Array<{ bookingId: string; slot: "primary" | "second"; cleanerId: string; amount: number; transferId: string }>;
  /** Money sent to a cleaner that no completed job has claimed yet, by cleaner id. */
  unappliedCredit: Record<string, number>;
  /** Transfers to Connect accounts no cleaner is linked to (excluding the owner draw account). */
  unknownTransfers: Transfer[];
  ownerDraws: Transfer[];
  error?: string;
};

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: API_VERSION }) : null;
}

/** Every transfer out of the balance since `sinceIso`, oldest first. */
export async function listTransfers(sinceIso: string = "2026-08-01T00:00:00Z"): Promise<Transfer[]> {
  const stripe = client();
  if (!stripe) return [];
  const out: Transfer[] = [];
  const since = Math.floor(Date.parse(sinceIso) / 1000);
  for await (const t of stripe.transfers.list({ limit: 100, created: { gte: since } })) {
    if (t.reversed) continue;
    out.push({
      id: t.id,
      created: new Date(t.created * 1000).toISOString(),
      amount: (t.amount - (t.amount_reversed ?? 0)) / 100,
      destination: typeof t.destination === "string" ? t.destination : (t.destination?.id ?? ""),
    });
  }
  return out.sort((a, b) => (a.created < b.created ? -1 : 1));
}

export async function reconcileCleanerPayouts(): Promise<ReconcileResult> {
  const result: ReconcileResult = { ok: true, stamped: [], unappliedCredit: {}, unknownTransfers: [], ownerDraws: [] };
  try {
    const transfers = await listTransfers(PAYOUT_MATCH_SINCE);
    if (!transfers.length) return result;

    const { data: cleaners } = await supabaseAdmin.from("cleaners").select("id, stripe_account_id");
    const cleanerByAccount = new Map<string, string>();
    for (const c of cleaners ?? []) if (c.stripe_account_id) cleanerByAccount.set(c.stripe_account_id, c.id);

    // Jobs that can consume a transfer: completed, pay set, and either still
    // owed or paid inside the matching window (those already consumed money).
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("id, service_date, completed_at, assigned_cleaner_id, second_cleaner_id, cleaner_pay, cleaner_paid_at, second_cleaner_pay, second_cleaner_paid_at")
      .eq("status", "completed")
      .gte("service_date", "2026-08-01")
      .order("service_date", { ascending: true });
    if (error) return { ...result, ok: false, error: error.message };

    type Slot = { job: Job; slot: "primary" | "second"; cleanerId: string; pay: number; paidAt: string | null; doneAt: string };
    const slots: Slot[] = [];
    for (const j of (rows ?? []) as Job[]) {
      const doneAt = j.completed_at ?? `${j.service_date}T23:59:59Z`;
      if (j.assigned_cleaner_id && j.cleaner_pay != null && (!j.cleaner_paid_at || j.cleaner_paid_at >= PAYOUT_MATCH_SINCE)) {
        slots.push({ job: j, slot: "primary", cleanerId: j.assigned_cleaner_id, pay: j.cleaner_pay, paidAt: j.cleaner_paid_at, doneAt });
      }
      if (j.second_cleaner_id && j.second_cleaner_pay != null && (!j.second_cleaner_paid_at || j.second_cleaner_paid_at >= PAYOUT_MATCH_SINCE)) {
        slots.push({ job: j, slot: "second", cleanerId: j.second_cleaner_id, pay: j.second_cleaner_pay, paidAt: j.second_cleaner_paid_at, doneAt });
      }
    }
    slots.sort((a, b) => (a.doneAt < b.doneAt ? -1 : 1));

    const credit = new Map<string, number>();
    const consumed = new Set<Slot>();
    const DAY = 24 * 60 * 60 * 1000;

    for (const t of transfers) {
      if (t.destination === OWNER_DRAW_ACCOUNT) {
        result.ownerDraws.push(t);
        continue;
      }
      const cleanerId = cleanerByAccount.get(t.destination);
      if (!cleanerId) {
        result.unknownTransfers.push(t);
        continue;
      }
      let pool = (credit.get(cleanerId) ?? 0) + t.amount;
      // Oldest unconsumed job first; only jobs finished by the time the money
      // went out (a day of slack for same-evening payouts stamped the next morning).
      for (const s of slots) {
        if (consumed.has(s) || s.cleanerId !== cleanerId) continue;
        if (Date.parse(s.doneAt) > Date.parse(t.created) + DAY) break;
        if (pool + 0.005 < s.pay) break;
        pool -= s.pay;
        consumed.add(s);
        if (s.paidAt) continue; // already recorded (hand-stamped or an earlier run)
        const update =
          s.slot === "second"
            ? { second_cleaner_paid_at: t.created, second_cleaner_payout_ref: t.id }
            : { cleaner_paid_at: t.created, cleaner_payout_ref: t.id };
        const { error: upErr } = await supabaseAdmin.from("bookings").update(update).eq("id", s.job.id);
        if (!upErr) result.stamped.push({ bookingId: s.job.id, slot: s.slot, cleanerId, amount: s.pay, transferId: t.id });
      }
      credit.set(cleanerId, Math.round(pool * 100) / 100);
    }
    for (const [cleanerId, c] of credit) if (c > 0.005) result.unappliedCredit[cleanerId] = c;
    return result;
  } catch (e) {
    console.error("[stripe-payouts] reconcile failed:", (e as Error)?.message);
    return { ...result, ok: false, error: (e as Error)?.message };
  }
}
