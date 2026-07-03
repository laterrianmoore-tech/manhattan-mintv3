import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, newDate } = await req.json();
  if (!bookingId || !newDate) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return NextResponse.json({ ok: false, error: "Bad date format" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, service_summary, bedrooms, status, assigned_cleaner_id, dispatch_sms_sent_at, preferred_time_ranges, customers(first_name, last_name, address, apt_no)"
    )
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json(
      { ok: false, error: `Can't reschedule a ${booking.status} job.` },
      { status: 400 }
    );
  }

  const oldDate = booking.service_date;

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({ service_date: newDate })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[reschedule] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Alert the cleaner only if they were actually dispatched for this job
  let cleanerNotified = false;
  if (booking.assigned_cleaner_id && booking.dispatch_sms_sent_at) {
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone, portal_token")
      .eq("id", booking.assigned_cleaner_id)
      .single();

    if (cleaner?.phone) {
      const customer = booking.customers as any;
      const fmt = (d: string) =>
        new Date(d + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      const timeRange = Array.isArray(booking.preferred_time_ranges)
        ? booking.preferred_time_ranges.join(", ")
        : booking.preferred_time_ranges || "";
      const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";

      const result = await sendSms({
        to: cleaner.phone,
        body: `RESCHEDULED — ${customer?.first_name}'s job moved from ${fmt(oldDate)} to ${fmt(
          newDate
        )}${timeRange ? ` ${timeRange}` : ""}
${customer?.address}${aptSuffix}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`,
        cleanerId: cleaner.id,
        bookingId: booking.id,
        recipientType: "cleaner",
        eventType: "rescheduled",
      });
      cleanerNotified = result.ok;
    }
  }

  return NextResponse.json({ ok: true, cleanerNotified });
}
