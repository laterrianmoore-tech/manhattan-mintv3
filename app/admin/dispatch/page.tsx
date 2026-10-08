import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLoginForm from "./AdminLoginForm";
import DispatchRow from "./DispatchRow";
import AssignedRow from "./AssignedRow";
import ReviewsTable, { type ReviewRow } from "./ReviewsTable";
import { computeCleanerPay, payNote } from "@/lib/cleaner-pay";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;

  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return <AdminLoginForm />;
  }

  // Both booking lists read every column ("*") so the cleaner-pay fields added
  // 2026-10-08 come through when present and are simply undefined before the
  // migration has run, instead of failing the whole page.
  const [{ data: unassigned }, { data: cleaners }, { data: assigned }] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("*, customers(first_name, last_name, address, apt_no)")
      .is("assigned_cleaner_id", null)
      .eq("status", "pending")
      .order("service_date", { ascending: true }),

    supabaseAdmin
      .from("cleaners")
      .select("id, first_name, last_name, status, portal_token, phone")
      .in("status", ["active", "onboarding"])
      .order("first_name"),

    supabaseAdmin
      .from("bookings")
      .select("*, customers(first_name, last_name, address)")
      .not("assigned_cleaner_id", "is", null)
      .in("status", ["confirmed", "in_progress"])
      .order("service_date", { ascending: true })
      .limit(20),
  ]);

  const cleanerMap = new Map((cleaners ?? []).map((c) => [c.id, c]));

  // Table estimate for jobs not yet dispatched. The regular-cleaner recurring
  // rate depends on who gets the job, so dispatch recomputes once a cleaner
  // is picked; this is the number the owner sees before choosing.
  const suggestedPay = new Map<string, { amount: number; note: string; warnings: string[] }>();
  for (const b of (unassigned ?? []) as any[]) {
    const r = computeCleanerPay({ ...b, dispatchedAt: new Date() });
    suggestedPay.set(b.id, { amount: r.amount, note: payNote(r), warnings: [...r.warnings, ...r.assumptions] });
  }

  // Review-link tracking (2026-09-18). Queried on its own so a database that
  // hasn't run the migration yet shows a note here instead of breaking dispatch.
  const reviewsQuery = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, review_link_sent_at, review_link_clicked_at, review_nudge_sent_at, review_received_at, customers(first_name, last_name)"
    )
    .not("review_link_sent_at", "is", null)
    .order("review_link_sent_at", { ascending: false })
    .limit(30);
  const reviewRows: ReviewRow[] = (reviewsQuery.data ?? []).map((b: any) => ({
    id: b.id,
    service_date: b.service_date,
    customer: [b.customers?.first_name, b.customers?.last_name].filter(Boolean).join(" ") || "—",
    review_link_sent_at: b.review_link_sent_at ?? null,
    review_link_clicked_at: b.review_link_clicked_at ?? null,
    review_nudge_sent_at: b.review_nudge_sent_at ?? null,
    review_received_at: b.review_received_at ?? null,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
              <DispatchRow key={b.id} booking={b as any} cleaners={cleaners ?? []} suggestedPay={suggestedPay.get(b.id) ?? null} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming assigned jobs — completed and cancelled are hidden */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-4">
          Assigned Jobs
        </h2>
        {!assigned?.length ? (
          <p className="text-sm text-gray-400">No active assigned jobs.</p>
        ) : (
          <div className="space-y-2">
            {assigned.map((b) => {
              const cleaner = cleanerMap.get(b.assigned_cleaner_id!);
              const second = b.second_cleaner_id ? cleanerMap.get(b.second_cleaner_id) : null;
              return (
                <AssignedRow
                  key={b.id}
                  booking={b as any}
                  cleanerName={cleaner ? cleaner.first_name : null}
                  secondCleanerName={second ? second.first_name : null}
                  cleaners={cleaners ?? []}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Google review tracking — first-time customers only (repeat/recurring get no review ask) */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-1">Reviews</h2>
        <p className="text-xs text-gray-400 mb-4">
          Who was sent the Google review link, who tapped it, who got the day-3 nudge. Mark a review received when it shows up on Google.
        </p>
        {reviewsQuery.error ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Review tracking isn&apos;t set up in the database yet — run{" "}
            <code className="text-xs">lib/supabase/migrations/2026-09-18-review-tracking.sql</code> in the Supabase SQL editor.
          </p>
        ) : (
          <ReviewsTable rows={reviewRows} />
        )}
      </section>
    </div>
  );
}
