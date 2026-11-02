import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLoginForm from "./AdminLoginForm";
import DispatchRow from "./DispatchRow";
import AssignedRow from "./AssignedRow";
import WeekBoard from "./WeekBoard";
import ReviewActions, { type ReviewActionRow } from "./ReviewActions";
import { fetchGoogleRating } from "@/lib/google-rating";
import { computeCleanerPay, payNote } from "@/lib/cleaner-pay";
import {
  addDays,
  cleanerDayStatus,
  fmtDay,
  shortWindow,
  todayNy,
  type BoardCleaner,
  type BoardJob,
  type CleanerDayStatus,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;

  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return <AdminLoginForm />;
  }

  // Week board window (2026-11-02): seven days from today, or ?week=1 for
  // the seven after that.
  const sp = await searchParams;
  const weekRaw = Array.isArray(sp.week) ? sp.week[0] : sp.week;
  const weekOffset = Math.max(0, Math.min(8, Number.parseInt(weekRaw ?? "0", 10) || 0));
  const today = todayNy();
  const boardStart = addDays(today, weekOffset * 7);
  const boardDays = Array.from({ length: 7 }, (_, i) => addDays(boardStart, i));
  const boardEnd = boardDays[boardDays.length - 1];

  // Cleaners: available_days is the usual-days column (2026-11-02). Ask for it
  // first; a database that hasn't run the migration answers with an error, so
  // fall back to the old column list and tell the board it isn't there.
  const cleanerCols = "id, first_name, last_name, status, portal_token, phone";
  let cleanersRes = await supabaseAdmin
    .from("cleaners")
    .select(cleanerCols + ", available_days")
    .in("status", ["active", "onboarding"])
    .order("first_name");
  let availabilityEnabled = true;
  if (cleanersRes.error) {
    availabilityEnabled = false;
    cleanersRes = (await supabaseAdmin
      .from("cleaners")
      .select(cleanerCols)
      .in("status", ["active", "onboarding"])
      .order("first_name")) as typeof cleanersRes;
  }
  const cleaners = (cleanersRes.data ?? []) as any[];

  // Both booking lists read every column ("*") so the cleaner-pay fields added
  // 2026-10-08 come through when present and are simply undefined before the
  // migration has run, instead of failing the whole page.
  const recentSince = addDays(today, -90);
  const [{ data: unassigned }, { data: assigned }, { data: boardRows }, { data: recentRows }] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("*, customers(first_name, last_name, address, apt_no)")
      .is("assigned_cleaner_id", null)
      .eq("status", "pending")
      .order("service_date", { ascending: true }),

    supabaseAdmin
      .from("bookings")
      .select("*, customers(first_name, last_name, address)")
      .not("assigned_cleaner_id", "is", null)
      .in("status", ["confirmed", "in_progress"])
      .order("service_date", { ascending: true })
      .limit(20),

    // Everything live inside the board window, assigned or not.
    supabaseAdmin
      .from("bookings")
      .select("id, service_date, status, preferred_time_ranges, assigned_cleaner_id, second_cleaner_id, customers(first_name, last_name)")
      .gte("service_date", boardStart)
      .lte("service_date", boardEnd)
      .in("status", ["pending", "confirmed", "in_progress"])
      .order("service_date", { ascending: true }),

    // Who has actually worked lately. Cleaners with nothing in 90 days and no
    // usual days set (test accounts, placeholders, people who drifted off)
    // fold up under "show more" on the board and sit last in the pickers.
    supabaseAdmin
      .from("bookings")
      .select("assigned_cleaner_id, second_cleaner_id")
      .gte("service_date", recentSince)
      .neq("status", "cancelled"),
  ]);

  const cleanerMap = new Map(cleaners.map((c) => [c.id, c]));

  const recentIds = new Set<string>();
  for (const r of (recentRows ?? []) as any[]) {
    if (r.assigned_cleaner_id) recentIds.add(r.assigned_cleaner_id);
    if (r.second_cleaner_id) recentIds.add(r.second_cleaner_id);
  }
  const boardCleaners: BoardCleaner[] = cleaners.map((c) => {
    const days = Array.isArray(c.available_days) && c.available_days.length ? c.available_days : null;
    return {
      id: c.id,
      first_name: c.first_name,
      available_days: days,
      quiet: !recentIds.has(c.id) && !days,
    };
  });
  const toBoardJob = (b: any): BoardJob => ({
    id: b.id,
    service_date: b.service_date,
    status: b.status,
    customer: b.customers?.first_name || b.customers?.last_name || "Booking",
    window: shortWindow(b.preferred_time_ranges),
    assigned_cleaner_id: b.assigned_cleaner_id ?? null,
    second_cleaner_id: b.second_cleaner_id ?? null,
  });
  const boardJobs: BoardJob[] = ((boardRows ?? []) as any[]).map(toBoardJob);

  // For each open job: what every cleaner's day looks like on its date. The
  // board window may not cover a job weeks out, so this uses the assigned list
  // plus the board rows, de-duplicated by id.
  const knownJobs = new Map<string, BoardJob>();
  for (const b of (assigned ?? []) as any[]) knownJobs.set(b.id, toBoardJob(b));
  for (const j of boardJobs) knownJobs.set(j.id, j);
  const allKnown = Array.from(knownJobs.values());
  const statusByBooking = new Map<string, Record<string, CleanerDayStatus & { quiet?: boolean }>>();
  for (const b of (unassigned ?? []) as any[]) {
    const rec: Record<string, CleanerDayStatus & { quiet?: boolean }> = {};
    for (const c of boardCleaners) rec[c.id] = { ...cleanerDayStatus(c, b.service_date, allKnown), quiet: c.quiet };
    statusByBooking.set(b.id, rec);
  }

  // Table estimate for jobs not yet dispatched. The regular-cleaner recurring
  // rate depends on who gets the job, so dispatch recomputes once a cleaner
  // is picked; this is the number the owner sees before choosing.
  const suggestedPay = new Map<string, { amount: number; note: string; warnings: string[] }>();
  for (const b of (unassigned ?? []) as any[]) {
    const r = computeCleanerPay({ ...b, dispatchedAt: new Date() });
    suggestedPay.set(b.id, { amount: r.amount, note: payNote(r), warnings: [...r.warnings, ...r.assumptions] });
  }

  // Assigned jobs grouped by day (2026-11-02) so a glance down the page reads
  // like a calendar instead of one flat list.
  const assignedByDay = new Map<string, any[]>();
  for (const b of (assigned ?? []) as any[]) {
    const list = assignedByDay.get(b.service_date) ?? [];
    list.push(b);
    assignedByDay.set(b.service_date, list);
  }
  const dayLabel = (iso: string) => {
    if (iso === today) return "Today";
    if (iso === addDays(today, 1)) return "Tomorrow";
    return fmtDay(iso, { weekday: "long" });
  };

  // Review-link tracking (2026-09-18). Queried on its own so a database that
  // hasn't run the migration yet shows a note here instead of breaking dispatch.
  // Owner's to-do list, not a status table (owner 2026-10-20). Open items are
  // first-time customers whose review link went out in the last 21 days and
  // who haven't reviewed yet; received rows drop off.
  const sinceIso = new Date(Date.now() - 21 * 86_400_000).toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [reviewsQuery, receivedQuery, googleRating] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select(
        "id, service_date, assigned_cleaner_id, review_link_sent_at, review_link_clicked_at, review_nudge_sent_at, review_received_at, customers(first_name, last_name)"
      )
      .not("review_link_sent_at", "is", null)
      .is("review_received_at", null)
      .gte("review_link_sent_at", sinceIso)
      .order("service_date", { ascending: false })
      .limit(30),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).gte("review_received_at", monthStart.toISOString()),
    fetchGoogleRating().catch(() => null),
  ]);
  const reviewRows: ReviewActionRow[] = (reviewsQuery.data ?? []).map((b: any) => ({
    id: b.id,
    service_date: b.service_date,
    customer: [b.customers?.first_name, b.customers?.last_name].filter(Boolean).join(" ") || "—",
    cleaner: cleanerMap.get(b.assigned_cleaner_id)?.first_name ?? null,
    review_link_clicked_at: b.review_link_clicked_at ?? null,
    owner_ask_sent_at: b.review_nudge_sent_at ?? null,
    review_received_at: b.review_received_at ?? null,
  }));
  const receivedThisMonth = receivedQuery.count ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          <span style={{ color: "#1d9e75" }}>Manhattan Mint</span>
          <span className="text-gray-400 font-normal"> — Dispatch</span>
        </h1>
        <a href="/admin/accounting/" className="text-sm font-medium hover:underline" style={{ color: "#1d9e75" }}>
          Accounting →
        </a>
      </div>

      {/* Unassigned jobs */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Unassigned Jobs
      {/* Who's free this week */}
      <WeekBoard
        days={boardDays}
        today={today}
        cleaners={boardCleaners}
        jobs={boardJobs}
        availabilityEnabled={availabilityEnabled}
        weekOffset={weekOffset}
      />

          </h2>
          {(unassigned?.length ?? 0) > 0 && (
            <span
              className="text-xs font-semibold text-white rounded-full px-2 py-0.5"
              style={{ backgroundColor: "#1d9e75" }}
            >
              {unassigned!.length}
            </span>
          )}
        </div>
        {!unassigned?.length ? (
          <p className="text-sm text-gray-400">No unassigned bookings.</p>
        ) : (
          <div className="space-y-3">
            {unassigned.map((b) => (
              <DispatchRow
                key={b.id}
                booking={b as any}
                cleaners={cleaners}
                suggestedPay={suggestedPay.get(b.id) ?? null}
                cleanerStatus={statusByBooking.get(b.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming assigned jobs, by day — completed and cancelled are hidden */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-4">
          Assigned Jobs
        </h2>
        {!assigned?.length ? (
          <p className="text-sm text-gray-400">No active assigned jobs.</p>
        ) : (
          <div className="space-y-6">
            {Array.from(assignedByDay.entries()).map(([iso, list]) => {
              const who = Array.from(
                new Set(
                  list.flatMap((b: any) =>
                    [cleanerMap.get(b.assigned_cleaner_id)?.first_name, b.second_cleaner_id ? cleanerMap.get(b.second_cleaner_id)?.first_name : null].filter(Boolean),
                  ),
                ),
              );
              return (
                <div key={iso}>
                  <div className="flex items-baseline gap-2 mb-2 pb-1 border-b border-gray-200">
                    <span className="text-sm font-semibold" style={{ color: iso === today ? "#085041" : "#374151" }}>
                      {dayLabel(iso)}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDay(iso, { month: "short", day: "numeric" })}</span>
                    <span className="text-xs text-gray-400">
                      · {list.length} job{list.length === 1 ? "" : "s"}
                      {who.length > 0 && <> · {who.join(", ")}</>}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {list.map((b: any) => {
                      const cleaner = cleanerMap.get(b.assigned_cleaner_id!);
                      const second = b.second_cleaner_id ? cleanerMap.get(b.second_cleaner_id) : null;
                      return (
                        <AssignedRow
                          key={b.id}
                          booking={b as any}
                          cleanerName={cleaner ? cleaner.first_name : null}
                          secondCleanerName={second ? second.first_name : null}
                          cleaners={cleaners}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Google review tracking — first-time customers only (repeat/recurring get no review ask) */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">Reviews — your to-do list</h2>
        <p className="text-xs text-gray-400 mb-4">
          Nothing here sends on its own. Text the ask yourself, then mark the review received when it lands on Google.
        </p>
        {reviewsQuery.error ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Review tracking isn&apos;t set up in the database yet — run{" "}
            <code className="text-xs">lib/supabase/migrations/2026-09-18-review-tracking.sql</code> in the Supabase SQL editor.
          </p>
        ) : (
          <ReviewActions rows={reviewRows} receivedThisMonth={receivedThisMonth} rating={googleRating} />
        )}
      </section>
    </div>
  );
}
