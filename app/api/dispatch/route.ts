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

  const { bookingId, cleanerId } = await req.json();

  if (!bookingId || !cleanerId) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("*, customers(*)")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  const { data: cleaner, error: cleanerErr } = await supabaseAdmin
    .from("cleaners")
    .select("id, first_name, last_name, phone, portal_token")
    .eq("id", cleanerId)
    .single();

  if (cleanerErr || !cleaner) {
    return NextResponse.json({ ok: false, error: "Cleaner not found" }, { status: 404 });
  }

  if (!cleaner.portal_token) {
    return NextResponse.json({ ok: false, error: "Cleaner has no portal token" }, { status: 400 });
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({
      assigned_cleaner_id: cleanerId,
      status: "confirmed",
      dispatch_sms_sent_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[dispatch] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  const customer = booking.customers as any;
  const serviceDate = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : booking.preferred_time_ranges || "";
  const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";

  const body = `New job — ${serviceDate} ${timeRange}
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms}BR · ${booking.service_summary}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`;

  await sendSms({
    to: cleaner.phone,
    body,
    cleanerId,
    bookingId,
    recipientType: "cleaner",
    eventType: "dispatch",
  });

  return NextResponse.json({ ok: true });
}
