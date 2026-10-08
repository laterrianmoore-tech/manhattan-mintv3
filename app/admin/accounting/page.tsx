import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLoginForm from "../dispatch/AdminLoginForm";
import MarkPaidForm from "./MarkPaidForm";

export const dynamic = "force-dynamic";

// Accounting (2026-10-08): the weekly ledger and the Friday payout list.
//
// Every number here is a database read. Cleaner pay is set at dispatch
// (src/lib/cleaner-pay.ts) or by the owner; collected amounts and Stripe
// fees are copied onto the booking when the money moves
// (src/lib/stripe-accounting.ts). Weeks run Monday to Sunday on the service
// date, which is how payouts have always been grouped.

type Row = {
  id: string;
  service_date: string;
  status: string;
  frequency: string | null;
  service_summary: string | null;
  bedrooms: number | null;
  pricing_total: number;
  assigned_cleaner_id: string | null;
  second_cleaner_id: string | null;
  cleaner_pay: number | null;
  second_cleaner_pay: number | null;
  cleaner_pay_source: string | null;
  cleaner_pay_note: string | null;
  cleaner_paid_at: string | null;
  cleaner_payout_ref: string | null;
  second_cleaner_paid_at: string | null;
  second_cleaner_payout_ref: string | null;
  collected_cents: number | null;
  stripe_fee_cents: number | null;
  collected_ref: string | null;
  stripe_charge_id: string | null;
  completed_at: string | null;
  customers: { first_name: string; last_name: string } | null;
};

const LEDGER_SINCE = "2026-08-15";

function nyToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
function addDays(ymd: string, n: number) {
  const d = new Date(ymd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOf(ymd: string) {
  const d = new Date(ymd + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
}
function fmtDay(ymd: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(ymd + "T12:00:00").toLocaleDateString("en-US", opts);
}
function money(n: number | null | undefined, { cents = false, dash = "—" }: { cents?: boolean; dash?: string } = {}) {
  if (n == null) return dash;
  const v = cents ? n / 100 : n;
  const neg = v < 0;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
  return `${neg ? "−" : ""}$${s}`;
}

// Per-job economics. "Collected" is the real number when Stripe has told us;
// until then the ticket stands in and the row says so.
function economics(r: Row) {
  const billed = Number(r.pricing_total ?? 0);
  const collectedKnown = r.collected_cents != null;
  const collected = collectedKnown ? r.collected_cents! / 100 : billed;
  const fee = (r.stripe_fee_cents ?? 0) / 100;
  const pay = (r.cleaner_pay ?? 0) + (r.second_cleaner_pay ?? 0);
  const payKnown = r.cleaner_pay != null;
  const margin = collected - fee - pay;
  return { billed, collected, collectedKnown, fee, pay, payKnown, margin };
}

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return <AdminLoginForm />;
  }

  const { week } = await searchParams;
  const today = nyToday();
  const thisMonday = mondayOf(today);
  const weekStart = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? mondayOf(week) : thisMonday;
  const weekEnd = addDays(weekStart, 6);

  const [{ data: cleaners }, { data: rows, error }] = await Promise.all([
    supabaseAdmin.from("cleaners").select("id, first_name, last_name"),
    supabaseAdmin
      .from("bookings")
      .select("*, customers(first_name, last_name)")
      .gte("service_date", LEDGER_SINCE)
      .neq("status", "cancelled")
      .order("service_date", { ascending: true }),
  ]);
  const cleanerName = (id: string | null) => {
    const c = (cleaners ?? []).find((x) => x.id === id);
    return c ? `${c.first_name}${c.last_name ? ` ${c.last_name[0]}.` : ""}` : "—";
  };
  const all = (rows ?? []) as unknown as Row[];
  const migrated = all.length === 0 || "cleaner_pay" in (all[0] as object);
  const completed = all.filter((r) => r.status === "completed");

  // ── Payout list: completed, pay set, not yet paid ──────────────────────
  type Owed = { bookingId: string; slot: "primary" | "second"; cleanerId: string; date: string; customer: string; amount: number; note: string | null };
  const owed: Owed[] = [];
  for (const r of completed) {
    const customer = [r.customers?.first_name, r.customers?.last_name?.[0] ? `${r.customers.last_name[0]}.` : ""].filter(Boolean).join(" ");
    if (r.assigned_cleaner_id && r.cleaner_pay != null && !r.cleaner_paid_at) {
      owed.push({ bookingId: r.id, slot: "primary", cleanerId: r.assigned_cleaner_id, date: r.service_date, customer, amount: r.cleaner_pay, note: r.cleaner_pay_note });
    }
    if (r.second_cleaner_id && r.second_cleaner_pay != null && !r.second_cleaner_paid_at) {
      owed.push({ bookingId: r.id, slot: "second", cleanerId: r.second_cleaner_id, date: r.service_date, customer, amount: r.second_cleaner_pay, note: "2nd cleaner" });
    }
  }
  const owedByCleaner = new Map<string, Owed[]>();
  for (const o of owed) owedByCleaner.set(o.cleanerId, [...(owedByCleaner.get(o.cleanerId) ?? []), o]);
  const owedTotal = owed.reduce((s, o) => s + o.amount, 0);
  // Completed jobs with no pay on record at all: the ledger can't count them.
  const payMissing = completed.filter((r) => r.assigned_cleaner_id && r.cleaner_pay == null);
  // Collected jobs Stripe hasn't been asked about yet.
  const collectMissing = completed.filter((r) => r.collected_cents == null && r.pricing_total > 0);

  // ── Weekly ledger ──────────────────────────────────────────────────────
  const weeks = new Map<string, Row[]>();
  for (const r of completed) {
    const m = mondayOf(r.service_date);
    weeks.set(m, [...(weeks.get(m) ?? []), r]);
  }
  const weekKeys = [...weeks.keys()].sort().reverse();
  const totals = (list: Row[]) =>
    list.reduce(
      (t, r) => {
        const e = economics(r);
        t.jobs++;
        t.billed += e.billed;
        t.collected += e.collected;
        t.fee += e.fee;
        t.pay += e.pay;
        t.margin += e.margin;
        if (!e.collectedKnown) t.estimated++;
        return t;
      },
      { jobs: 0, billed: 0, collected: 0, fee: 0, pay: 0, margin: 0, estimated: 0 },
    );

  const selected = (weeks.get(weekStart) ?? []).slice().sort((a, b) => (a.service_date < b.service_date ? -1 : 1));
  const selectedTotals = totals(selected);
  const monthStart = today.slice(0, 7) + "-01";
  const mtd = totals(completed.filter((r) => r.service_date >= monthStart && r.service_date <= today));
  const allTime = totals(completed);

  // ── Scheduled: pay already promised for jobs not done yet ──────────────
  const upcoming = all
    .filter((r) => (r.status === "confirmed" || r.status === "in_progress") && r.service_date >= today && r.service_date <= addDays(today, 7))
    .sort((a, b) => (a.service_date < b.service_date ? -1 : 1));
  const upcomingPay = upcoming.reduce((s, r) => s + (r.cleaner_pay ?? 0) + (r.second_cleaner_pay ?? 0), 0);

  const th = "text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 px-2 py-1.5";
  const thr = th + " text-right";
  const td = "px-2 py-1.5 text-sm text-gray-700 align-top";
  const tdr = td + " text-right tabular-nums";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          <span style={{ color: "#1d9e75" }}>Manhattan Mint</span>
          <span className="text-gray-400 font-normal"> — Accounting</span>
        </h1>
        <a href="/admin/dispatch/" className="text-sm font-medium hover:underline" style={{ color: "#1d9e75" }}>
          ← Dispatch
        </a>
      </div>
      <p className="text-xs text-gray-400 mb-8">
        Weeks run Monday to Sunday by service date. Pay is set at dispatch from the pay table (or by you); collected amounts and fees come from Stripe once the money moves.
      </p>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{error.message}</p>
      )}
      {!migrated && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          The pay and ledger columns aren&apos;t in the database yet. Run{" "}
          <code className="text-xs">lib/supabase/migrations/2026-10-08-cleaner-pay.sql</code> in the Supabase SQL editor, then{" "}
          <code className="text-xs">node scripts/backfill-cleaner-pay-1008.mjs</code> to fill in past jobs.
        </p>
      )}

      {/* ── Payouts ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Owed to cleaners</h2>
          {owedTotal > 0 && (
            <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ backgroundColor: "#1d9e75" }}>
              {money(owedTotal)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Completed jobs whose pay hasn&apos;t gone out. Send the transfer in Stripe, then mark it here.</p>
        {owed.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing owed. Everyone is paid up.</p>
        ) : (
          <div className="space-y-4">
            {[...owedByCleaner.entries()].map(([cleanerId, list]) => {
              const total = list.reduce((s, o) => s + o.amount, 0);
              return (
                <div key={cleanerId} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-semibold text-gray-900">{cleanerName(cleanerId)}</span>
                    <span className="font-semibold tabular-nums" style={{ color: "#085041" }}>{money(total)}</span>
                  </div>
                  <table className="w-full mb-3">
                    <tbody>
                      {list.map((o) => (
                        <tr key={o.bookingId + o.slot} className="border-t border-gray-100">
                          <td className={td + " w-24"}>{fmtDay(o.date, { weekday: "short", month: "short", day: "numeric" })}</td>
                          <td className={td}>{o.customer}</td>
                          <td className={td + " text-xs text-gray-400"}>{o.note ?? ""}</td>
                          <td className={tdr}>{money(o.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <MarkPaidForm
                    cleanerName={cleanerName(cleanerId).split(" ")[0]}
                    total={total}
                    items={list.map((o) => ({ bookingId: o.bookingId, slot: o.slot }))}
                  />
                </div>
              );
            })}
          </div>
        )}
        {payMissing.length > 0 && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {payMissing.length} completed job{payMissing.length === 1 ? " has" : "s have"} no pay on record (not counted above):{" "}
            {payMissing.slice(0, 6).map((r) => `${r.customers?.first_name ?? "?"} ${fmtDay(r.service_date)}`).join(", ")}
            {payMissing.length > 6 ? "…" : ""}. Set them with Edit pay on the dispatch page, or run the backfill script.
          </p>
        )}
      </section>

      {/* ── Scheduled ───────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">Next 7 days</h2>
          <p className="text-xs text-gray-400 mb-3">
            Pay already promised on scheduled jobs: <span className="font-semibold text-gray-700">{money(upcomingPay)}</span> across {upcoming.length} job{upcoming.length === 1 ? "" : "s"}.
          </p>
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Cleaner</th>
                <th className={thr}>Ticket</th>
                <th className={thr}>Pay</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className={td}>{fmtDay(r.service_date, { weekday: "short", month: "short", day: "numeric" })}</td>
                  <td className={td}>{r.customers?.first_name} {r.customers?.last_name?.[0] ? `${r.customers.last_name[0]}.` : ""}</td>
                  <td className={td}>{cleanerName(r.assigned_cleaner_id)}{r.second_cleaner_id ? ` + ${cleanerName(r.second_cleaner_id)}` : ""}</td>
                  <td className={tdr}>{money(r.pricing_total)}</td>
                  <td className={tdr}>
                    {r.cleaner_pay != null ? money(r.cleaner_pay + (r.second_cleaner_pay ?? 0)) : <span className="text-amber-600 text-xs">not set</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Summary tiles ───────────────────────────────────────────── */}
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: `Week of ${fmtDay(weekStart)}`, t: selectedTotals },
          { label: `${new Date(today + "T12:00:00").toLocaleDateString("en-US", { month: "long" })} to date`, t: mtd },
          { label: `Since ${fmtDay(LEDGER_SINCE)}`, t: allTime },
        ].map(({ label, t }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">{label}</div>
            <div className="text-2xl font-semibold tabular-nums" style={{ color: t.margin >= 0 ? "#085041" : "#b91c1c" }}>{money(t.margin)}</div>
            <div className="text-xs text-gray-500 mt-1">
              margin on {t.jobs} job{t.jobs === 1 ? "" : "s"} · {money(t.collected)} in · {money(t.pay)} pay · {money(t.fee, { cents: true })} fees
              {t.estimated > 0 && <span className="text-amber-600"> · {t.estimated} using ticket</span>}
            </div>
          </div>
        ))}
      </section>

      {/* ── Week detail ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Week of {fmtDay(weekStart, { weekday: "short", month: "short", day: "numeric" })} – {fmtDay(weekEnd, { month: "short", day: "numeric" })}
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <a href={`/admin/accounting/?week=${addDays(weekStart, -7)}`} className="hover:underline" style={{ color: "#1d9e75" }}>← prev</a>
            {weekStart !== thisMonday && (
              <a href="/admin/accounting/" className="hover:underline" style={{ color: "#1d9e75" }}>this week</a>
            )}
            {weekStart < thisMonday && (
              <a href={`/admin/accounting/?week=${addDays(weekStart, 7)}`} className="hover:underline" style={{ color: "#1d9e75" }}>next →</a>
            )}
          </div>
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-gray-400">No completed jobs this week yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-xl overflow-hidden min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Cleaner</th>
                  <th className={thr}>Ticket</th>
                  <th className={thr}>Collected</th>
                  <th className={thr}>Fee</th>
                  <th className={thr}>Pay</th>
                  <th className={thr}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((r) => {
                  const e = economics(r);
                  const paid = r.cleaner_paid_at != null;
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className={td}>{fmtDay(r.service_date, { weekday: "short", day: "numeric" })}</td>
                      <td className={td}>
                        {r.customers?.first_name} {r.customers?.last_name?.[0] ? `${r.customers.last_name[0]}.` : ""}
                        <div className="text-[11px] text-gray-400">{r.service_summary}</div>
                      </td>
                      <td className={td}>
                        {cleanerName(r.assigned_cleaner_id)}{r.second_cleaner_id ? ` + ${cleanerName(r.second_cleaner_id)}` : ""}
                      </td>
                      <td className={tdr}>{money(e.billed)}</td>
                      <td className={tdr} title={r.collected_ref ?? "Not yet confirmed by Stripe — ticket used"}>
                        {e.collectedKnown ? money(r.collected_cents, { cents: true }) : <span className="text-amber-600">{money(e.billed)}?</span>}
                      </td>
                      <td className={tdr + " text-gray-400"}>{e.collectedKnown ? money(r.stripe_fee_cents, { cents: true }) : "—"}</td>
                      <td className={tdr} title={r.cleaner_pay_note ?? ""}>
                        {e.payKnown ? (
                          <>
                            {money(e.pay)}
                            <div className="text-[10px] font-normal" style={{ color: paid ? "#1d9e75" : "#d97706" }}>{paid ? "paid" : "owed"}</div>
                          </>
                        ) : (
                          <span className="text-amber-600 text-xs">not set</span>
                        )}
                      </td>
                      <td className={tdr + " font-semibold"} style={{ color: e.margin >= 0 ? "#085041" : "#b91c1c" }}>{money(e.margin)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                  <td className={td} colSpan={3}>{selectedTotals.jobs} job{selectedTotals.jobs === 1 ? "" : "s"}</td>
                  <td className={tdr}>{money(selectedTotals.billed)}</td>
                  <td className={tdr}>{money(selectedTotals.collected)}</td>
                  <td className={tdr + " text-gray-500"}>{money(selectedTotals.fee, { cents: true })}</td>
                  <td className={tdr}>{money(selectedTotals.pay)}</td>
                  <td className={tdr} style={{ color: selectedTotals.margin >= 0 ? "#085041" : "#b91c1c" }}>{money(selectedTotals.margin)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── All weeks ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-3">By week</h2>
        <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Week of</th>
              <th className={thr}>Jobs</th>
              <th className={thr}>Collected</th>
              <th className={thr}>Fees</th>
              <th className={thr}>Pay</th>
              <th className={thr}>Margin</th>
              <th className={thr}>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {weekKeys.map((k) => {
              const t = totals(weeks.get(k)!);
              const pct = t.collected > 0 ? Math.round((t.margin / t.collected) * 100) : null;
              const isSel = k === weekStart;
              return (
                <tr key={k} className={"border-t border-gray-100" + (isSel ? " bg-green-50" : "")}>
                  <td className={td}>
                    <a href={`/admin/accounting/?week=${k}`} className="hover:underline" style={{ color: "#1d9e75" }}>
                      {fmtDay(k, { month: "short", day: "numeric" })}
                    </a>
                    {t.estimated > 0 && <span className="ml-1 text-[10px] text-amber-600" title="Some rows use the ticket price until Stripe confirms">~</span>}
                  </td>
                  <td className={tdr}>{t.jobs}</td>
                  <td className={tdr}>{money(t.collected)}</td>
                  <td className={tdr + " text-gray-400"}>{money(t.fee, { cents: true })}</td>
                  <td className={tdr}>{money(t.pay)}</td>
                  <td className={tdr + " font-semibold"} style={{ color: t.margin >= 0 ? "#085041" : "#b91c1c" }}>{money(t.margin)}</td>
                  <td className={tdr + " text-gray-500"}>{pct == null ? "—" : `${pct}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {collectMissing.length > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            {collectMissing.length} completed job{collectMissing.length === 1 ? "" : "s"} still show the ticket price instead of what Stripe collected. Run{" "}
            <code>node scripts/backfill-cleaner-pay-1008.mjs</code> to sync them.
          </p>
        )}
      </section>
    </div>
  );
}
