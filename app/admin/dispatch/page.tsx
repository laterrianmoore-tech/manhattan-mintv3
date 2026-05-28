import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLoginForm from "./AdminLoginForm";
import DispatchRow from "./DispatchRow";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;

  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return <AdminLoginForm />;
  }

  const [{ data: unassigned }, { data: cleaners }, { data: assigned }] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select(
        "id, service_date, service_summary, bedrooms, preferred_time_ranges, customers(first_name, last_name, address, apt_no)"
      )
      .is("assigned_cleaner_id", null)
      .not("status", "eq", "cancelled")
      .order("service_date", { ascending: true }),

    supabaseAdmin
      .from("cleaners")
      .select("id, first_name, last_name, status, portal_token, phone")
      .in("status", ["active", "onboarding"])
      .order("first_name"),

    supabaseAdmin
      .from("bookings")
      .select(
        "id, service_date, service_summary, assigned_cleaner_id, dispatch_sms_sent_at, status, customers(first_name, last_name, address)"
      )
      .not("assigned_cleaner_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const cleanerMap = new Map((cleaners ?? []).map((c) => [c.id, c]));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        <span style={{ color: "#1d9e75" }}>Manhattan Mint</span>
        <span className="text-gray-400 font-normal"> — Dispatch</span>
      </h1>

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
              <DispatchRow key={b.id} booking={b as any} cleaners={cleaners ?? []} />
            ))}
          </div>
        )}
      </section>

      {/* Recently assigned */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-4">
          Recently Assigned
        </h2>
        {!assigned?.length ? (
          <p className="text-sm text-gray-400">No assigned bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {assigned.map((b) => {
              const cleaner = cleanerMap.get(b.assigned_cleaner_id!);
              const customer = b.customers as any;
              const dateStr = new Date(b.service_date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {customer?.first_name} {customer?.last_name} &middot; {dateStr}
                    </div>
                    <div className="text-gray-500 text-xs truncate mt-0.5">
                      {customer?.address} &middot; {b.service_summary}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {cleaner && (
                      <span className="text-gray-600 text-xs">{cleaner.first_name}</span>
                    )}
                    {b.dispatch_sms_sent_at ? (
                      <span
                        className="text-base font-bold"
                        style={{ color: "#1d9e75" }}
                        title="SMS sent"
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="text-gray-300 text-base" title="SMS not sent">
                        ○
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
