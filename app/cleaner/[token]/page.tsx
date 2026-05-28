import { supabaseAdmin } from "@/lib/supabase";
import JobActions from "./JobActions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function CleanerPortal({ params }: Props) {
  const { token } = await params;

  const { data: cleaner } = await supabaseAdmin
    .from("cleaners")
    .select("id, first_name, last_name")
    .eq("portal_token", token)
    .single();

  if (!cleaner) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400 text-base">Page not found.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: allBookings } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, service_summary, bedrooms, bathrooms, preferred_time_ranges, cleaning_notes, status, on_the_way_at, arrived_at, completed_at, customers(first_name, address, apt_no, access_notes, key_access)"
    )
    .eq("assigned_cleaner_id", cleaner.id)
    .order("service_date", { ascending: true });

  const bookings = allBookings ?? [];

  const todayJobs = bookings.filter(
    (b) => b.service_date === today && !["completed", "cancelled"].includes(b.status ?? "")
  );
  const upcomingJobs = bookings.filter(
    (b) => b.service_date > today && !["completed", "cancelled"].includes(b.status ?? "")
  );
  const completedJobs = [...bookings]
    .filter((b) => b.completed_at)
    .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1))
    .slice(0, 10);

  const noJobs =
    todayJobs.length === 0 && upcomingJobs.length === 0 && completedJobs.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-16">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: "#085041" }}>
        Hi {cleaner.first_name} — your jobs
      </h1>

      {todayJobs.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#1d9e75" }}
          >
            Today
          </h2>
          <div className="space-y-4">
            {todayJobs.map((b) => (
              <JobCard key={b.id} booking={b} token={token} />
            ))}
          </div>
        </section>
      )}

      {upcomingJobs.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#1d9e75" }}
          >
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcomingJobs.map((b) => (
              <JobCard key={b.id} booking={b} token={token} />
            ))}
          </div>
        </section>
      )}

      {completedJobs.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">
            Completed
          </h2>
          <div className="space-y-2">
            {completedJobs.map((b) => {
              const customer = b.customers as any;
              return (
                <div
                  key={b.id}
                  className="flex justify-between items-center py-2.5 px-4 rounded-xl bg-gray-50 text-sm text-gray-500"
                >
                  <span>
                    {customer?.first_name} &middot; {customer?.address}
                  </span>
                  <span className="text-gray-400 text-xs ml-4 shrink-0">
                    {formatDate(b.service_date)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {noJobs && <p className="text-gray-400 text-sm">No jobs assigned yet.</p>}
    </div>
  );
}

function JobCard({ booking, token }: { booking: any; token: string }) {
  const customer = booking.customers as any;
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : booking.preferred_time_ranges || "";
  const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="space-y-0.5 mb-3">
        <div className="text-base font-semibold text-gray-900">{customer?.first_name}</div>
        <div className="text-sm text-gray-600">
          {customer?.address}
          {aptSuffix}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(booking.service_date)}
          {timeRange && <> &middot; {timeRange}</>}
        </div>
        <div className="text-sm text-gray-700 font-medium pt-0.5">
          {booking.bedrooms}BR &middot; {booking.service_summary}
        </div>
      </div>

      {(booking.cleaning_notes ||
        customer?.access_notes ||
        customer?.key_access === false) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {customer?.key_access === false && (
            <div className="inline-block text-xs font-medium text-amber-700 bg-amber-50 rounded px-2 py-1">
              No key — client will let you in
            </div>
          )}
          {customer?.access_notes && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Access:</span> {customer.access_notes}
            </p>
          )}
          {booking.cleaning_notes && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Notes:</span> {booking.cleaning_notes}
            </p>
          )}
        </div>
      )}

      <JobActions
        token={token}
        bookingId={booking.id}
        onTheWayAt={booking.on_the_way_at}
        arrivedAt={booking.arrived_at}
        completedAt={booking.completed_at}
      />
    </div>
  );
}
