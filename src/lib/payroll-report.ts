import { supabaseAdmin } from "./supabase";
import { reconcileCleanerPayouts } from "./stripe-payouts";

// Thursday payroll text to the owner (2026-10-22): who to pay, how much, for
// which jobs. Same definition of "owed" as /admin/accounting: completed jobs
// with a pay amount and no paid-at stamp. Stripe transfers are reconciled
// first, so anything already sent via Connect this week is not listed.

const LEDGER_SINCE = "2026-08-15";

export type PayrollLine = { date: string; customer: string; amount: number; note: string | null };
export type PayrollCleaner = { cleanerId: string; name: string; hasConnect: boolean; total: number; jobs: PayrollLine[] };
export type PayrollReport = {
  asOf: string; // YYYY-MM-DD, New York
  total: number;
  cleaners: PayrollCleaner[];
  /** Completed jobs with no pay recorded: the owner has to set pay before these can be paid. */
  payMissing: Array<{ date: string; customer: string; cleaner: string }>;
  reconcileError: string | null;
};

type Row = {
  id: string;
  service_date: string;
  status: string;
  assigned_cleaner_id: string | null;
  cleaner_pay: number | null;
  cleaner_pay_note: string | null;
  cleaner_paid_at: string | null;
  second_cleaner_id: string | null;
  second_cleaner_pay: number | null;
  second_cleaner_paid_at: string | null;
  customers: { first_name?: string | null; last_name?: string | null } | null;
};

function nyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
function custName(c: Row["customers"]): string {
  const first = (c?.first_name ?? "").trim();
  const last = (c?.last_name ?? "").trim();
  return `${first || "?"}${/^[A-Za-z]/.test(last) ? ` ${last[0]}.` : ""}`;
}
function mmdd(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export async function buildPayrollReport(): Promise<PayrollReport> {
  const reconcile = await reconcileCleanerPayouts().catch((e: Error) => ({ ok: false, error: e.message }) as { ok: boolean; error?: string });
  const [{ data: cleaners }, { data: rows, error }] = await Promise.all([
    supabaseAdmin.from("cleaners").select("id, first_name, stripe_account_id"),
    supabaseAdmin
      .from("bookings")
      .select("id, service_date, status, assigned_cleaner_id, cleaner_pay, cleaner_pay_note, cleaner_paid_at, second_cleaner_id, second_cleaner_pay, second_cleaner_paid_at, customers(first_name, last_name)")
      .gte("service_date", LEDGER_SINCE)
      .eq("status", "completed")
      .order("service_date", { ascending: true }),
  ]);
  if (error) throw new Error(`bookings: ${error.message}`);
  const byId = new Map((cleaners ?? []).map((c) => [c.id, c]));
  const name = (id: string) => byId.get(id)?.first_name ?? "Unknown";

  const map = new Map<string, PayrollCleaner>();
  const add = (cleanerId: string, line: PayrollLine) => {
    const c: PayrollCleaner = map.get(cleanerId) ?? { cleanerId, name: name(cleanerId), hasConnect: !!byId.get(cleanerId)?.stripe_account_id, total: 0, jobs: [] };
    c.jobs.push(line);
    c.total += line.amount;
    map.set(cleanerId, c);
  };
  const payMissing: PayrollReport["payMissing"] = [];
  for (const r of (rows ?? []) as unknown as Row[]) {
    const customer = custName(r.customers);
    if (r.assigned_cleaner_id) {
      if (r.cleaner_pay == null) payMissing.push({ date: r.service_date, customer, cleaner: name(r.assigned_cleaner_id) });
      else if (!r.cleaner_paid_at) add(r.assigned_cleaner_id, { date: r.service_date, customer, amount: Number(r.cleaner_pay), note: r.cleaner_pay_note });
    }
    if (r.second_cleaner_id && r.second_cleaner_pay != null && !r.second_cleaner_paid_at) {
      add(r.second_cleaner_id, { date: r.service_date, customer, amount: Number(r.second_cleaner_pay), note: "2nd cleaner" });
    }
  }
  const list = [...map.values()].sort((a, b) => b.total - a.total);
  return {
    asOf: nyToday(),
    total: list.reduce((s, c) => s + c.total, 0),
    cleaners: list,
    payMissing,
    reconcileError: reconcile.ok ? null : (reconcile as { error?: string }).error ?? "reconcile failed",
  };
}

export function formatPayrollSms(r: PayrollReport): string {
  const head = `Payroll ${mmdd(r.asOf)}`;
  if (r.cleaners.length === 0 && r.payMissing.length === 0) return `${head}: nothing owed. Everyone is paid up.`;
  const lines: string[] = [];
  for (const c of r.cleaners) {
    const jobs = c.jobs.map((j) => `${j.customer} ${mmdd(j.date)} $${j.amount}`).join(", ");
    lines.push(`${c.name} $${c.total}${c.hasConnect ? "" : " (no Stripe account, pay by hand)"}: ${jobs}`);
  }
  const out = [`${head}: pay $${r.total} total`, ...lines];
  if (r.payMissing.length) {
    out.push(`No pay set yet (fix on dispatch first): ${r.payMissing.map((p) => `${p.cleaner}/${p.customer} ${mmdd(p.date)}`).join(", ")}`);
  }
  if (r.reconcileError) out.push(`(Stripe transfer check failed, list may include something already sent)`);
  out.push(`Send transfers in Stripe; the ledger marks them paid on its own. manhattanmintnyc.com/admin/accounting`);
  return out.join("\n");
}
