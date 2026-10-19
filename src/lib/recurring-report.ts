import { supabaseAdmin } from "@/lib/supabase/server";

// Weekly recurring-conversion report (owner decision 2026-10-18): the one
// number the business bends toward is how many first cleans turn into a second
// booking within 30 days. Texted to the owner every Monday morning.
//
// Definitions
// - first clean: a customer's earliest completed booking (by service_date)
// - rebooked: that customer has any later non-cancelled booking (completed,
//   confirmed, pending, in progress) whose service_date is after the first
// - within 30 days: that later booking's service_date is <= first + 30 days,
//   OR it was created within 30 days of the first clean (a customer who books
//   their next visit six weeks out still counts: the decision was made in time)

type Row = {
  customer_id: string;
  status: string;
  service_date: string;
  created_at: string;
  frequency: string | null;
};

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => iso(new Date(new Date(`${d}T12:00:00Z`).getTime() + n * DAY));

export type RecurringReport = {
  asOf: string;
  recent: { from: string; to: string; firstCleans: number; rebooked: number; pct: number | null };
  matured: { from: string; to: string; firstCleans: number; rebooked: number; pct: number | null };
  onPlanWithFutureVisit: number;
  completedLast7: number;
  completedPrev7: number;
};

export async function buildRecurringReport(now: Date = new Date()): Promise<RecurringReport> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("customer_id, status, service_date, created_at, frequency")
    .in("status", ["completed", "confirmed", "pending", "in_progress"])
    .order("service_date", { ascending: true });
  if (error) throw new Error(`recurring report: ${error.message}`);
  const rows = (data ?? []) as Row[];

  const today = iso(now);
  const byCustomer = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.customer_id) continue;
    const list = byCustomer.get(r.customer_id) ?? [];
    list.push(r);
    byCustomer.set(r.customer_id, list);
  }

  type First = { customerId: string; date: string; rebookedIn30: boolean };
  const firsts: First[] = [];
  for (const [customerId, list] of byCustomer) {
    const completed = list.filter((r) => r.status === "completed").sort((a, b) => a.service_date.localeCompare(b.service_date));
    if (!completed.length) continue;
    const first = completed[0];
    const deadline = addDays(first.service_date, 30);
    const later = list.filter((r) => r.service_date > first.service_date);
    const rebookedIn30 = later.some((r) => r.service_date <= deadline || r.created_at.slice(0, 10) <= deadline);
    firsts.push({ customerId, date: first.service_date, rebookedIn30 });
  }

  const window = (from: string, to: string) => {
    const cohort = firsts.filter((f) => f.date >= from && f.date <= to);
    const rebooked = cohort.filter((f) => f.rebookedIn30).length;
    return { from, to, firstCleans: cohort.length, rebooked, pct: cohort.length ? Math.round((rebooked / cohort.length) * 100) : null };
  };

  // Customers on a recurring plan who actually have a next visit on the books.
  const onPlan = new Set<string>();
  for (const [customerId, list] of byCustomer) {
    const future = list.some((r) => r.service_date >= today && r.status !== "completed");
    const plan = list.some((r) => (r.frequency ?? "").toLowerCase().replace(/[^a-z]/g, "") !== "onetime" && (r.frequency ?? "") !== "");
    if (future && plan) onPlan.add(customerId);
  }

  const completedBetween = (from: string, to: string) => rows.filter((r) => r.status === "completed" && r.service_date >= from && r.service_date <= to).length;

  return {
    asOf: today,
    recent: window(addDays(today, -30), today),
    matured: window(addDays(today, -60), addDays(today, -31)),
    onPlanWithFutureVisit: onPlan.size,
    completedLast7: completedBetween(addDays(today, -6), today),
    completedPrev7: completedBetween(addDays(today, -13), addDays(today, -7)),
  };
}

const md = (d: string) => {
  const [, m, day] = d.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${Number(day)}`;
};

export function formatRecurringReportSms(r: RecurringReport): string {
  const pct = (w: RecurringReport["recent"]) => (w.pct === null ? "n/a" : `${w.pct}%`);
  return [
    `Manhattan Mint, Monday numbers (${md(r.asOf)}):`,
    `Repeat rate: ${r.matured.rebooked} of ${r.matured.firstCleans} first cleans from ${md(r.matured.from)}–${md(r.matured.to)} booked again within 30 days (${pct(r.matured)}).`,
    `Last 30 days: ${r.recent.firstCleans} first cleans, ${r.recent.rebooked} already rebooked (${pct(r.recent)}).`,
    `On a recurring plan with a next visit booked: ${r.onPlanWithFutureVisit}.`,
    `Cleans completed: ${r.completedLast7} this week, ${r.completedPrev7} the week before.`,
  ].join("\n");
}
