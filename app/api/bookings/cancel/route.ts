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

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ ok: false, error: "Missing bookingId" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, service_summary, status, assigned_cleaner_id, dispatch_sms_sent_at, preferred_time_ranges, customers(first_name, last_name, address, apt_no)"
    )
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }
  if (booking.status === "completed") {
    return NextResponse.json(
      { ok: false, error: "Job is already completed — can't cancel it." },
      { status: 400 }
    );
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[cancel] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Alert the cleaner only if they were actually dispatched for this job
  let cleanerNotified = false;
  if (booking.assigned_cleaner_id && booking.dispatch_sms_sent_at) {
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", booking.assigned_cleaner_id)
      .single();

    if (cleaner?.phone) {
      const customer = booking.customers as any;
      const serviceDate = new Date(booking.service_date + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "short", month: "short", day: "numeric" }
      );
      const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";

      const result = await sendSms({
        to: cleaner.phone,
        body: `CANCELED — ${serviceDate} job for ${customer?.first_name} at ${customer?.address}${aptSuffix} is canceled. Do not go.`,
        cleanerId: cleaner.id,
        bookingId: booking.id,
        recipientType: "cleaner",
        eventType: "cancelled",
      });
      cleanerNotified = result.ok;
    }
  }

  return NextResponse.json({ ok: true, cleanerNotified });
}
