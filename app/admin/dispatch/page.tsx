import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLoginForm from "./AdminLoginForm";
import DispatchRow from "./DispatchRow";
import AssignedRow from "./AssignedRow";

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
      .eq("status", "pending")
      .order("service_date", { ascending: true }),

    supabaseAdmin
      .from("cleaners")
      .select("id, first_name, last_name, status, portal_token, phone")
      .in("status", ["active", "onboarding"])
      .order("first_name"),

    supabaseAdmin
      .from("bookings")
      .select(
        "id, service_date, service_summary, assigned_cleaner_id, dispatch_sms_sent_at, status, preferred_time_ranges, customers(first_name, last_name, address)"
      )
      .not("assigned_cleaner_id", "is", null)
      .in("status", ["confirmed", "in_progress"])
      .order("service_date", { ascending: true })
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
              return (
                <AssignedRow
                  key={b.id}
                  booking={b as any}
                  cleanerName={cleaner ? cleaner.first_name : null}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
