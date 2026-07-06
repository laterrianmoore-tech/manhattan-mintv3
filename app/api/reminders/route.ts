import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

export const dynamic = "force-dynamic";

// Called once a day by the Netlify scheduled function (netlify/functions/job-reminders.mjs).
// Texts every dispatched cleaner a reminder for tomorrow's jobs. Safe to re-run only
// within the same day — each job qualifies for exactly one daily run, so the schedule
// itself is the dedupe.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // "Tomorrow" in New York, regardless of server timezone
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, service_summary, bedrooms, preferred_time_ranges, cleaning_notes, assigned_cleaner_id, dispatch_sms_sent_at, customers(first_name, address, apt_no)"
    )
    .eq("service_date", tomorrow)
    .eq("status", "confirmed")
    .not("assigned_cleaner_id", "is", null);

  if (error) {
    console.error("[reminders] fetch failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";
  const dateLabel = new Date(tomorrow + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  let sent = 0;
  const results: Array<{ bookingId: string; ok: boolean }> = [];

  for (const booking of bookings ?? []) {
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone, portal_token")
      .eq("id", booking.assigned_cleaner_id!)
      .single();

    if (!cleaner?.phone) continue;

    const customer = booking.customers as any;
    const timeRange = Array.isArray(booking.preferred_time_ranges)
      ? booking.preferred_time_ranges.join(", ")
      : booking.preferred_time_ranges || "";
    const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
    // Surface an exact arrival window if one was stamped into the notes
    const arrivalTag = (booking.cleaning_notes || "").match(/\[Arrival window: ([^\]]+)\]/)?.[1];

    const result = await sendSms({
      to: cleaner.phone,
      body: `REMINDER — job tomorrow (${dateLabel})${timeRange ? ` ${timeRange}` : ""}${
        arrivalTag ? ` — arrive ${arrivalTag}` : ""
      }
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms ? `${booking.bedrooms}BR · ` : ""}${booking.service_summary}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`,
      cleanerId: cleaner.id,
      bookingId: booking.id,
      recipientType: "cleaner",
      eventType: "reminder",
    });

    if (result.ok) sent++;
    results.push({ bookingId: booking.id, ok: result.ok });
  }

  return NextResponse.json({ ok: true, date: tomorrow, jobs: bookings?.length ?? 0, sent, results });
}
