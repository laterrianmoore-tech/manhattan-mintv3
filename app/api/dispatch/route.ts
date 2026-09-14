import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

// Assigns a cleaner to a booking and texts them the job.
//
// A job holds up to two cleaners: the primary in assigned_cleaner_id and an
// optional second in second_cleaner_id. `slot` picks which one this call sets
// (default "primary", so older callers are unchanged). For the second slot a
// null / empty cleanerId removes the second cleaner and tells them they're off.
type Slot = "primary" | "second";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, cleanerId, slot: rawSlot } = await req.json();
  const slot: Slot = rawSlot === "second" ? "second" : "primary";
  const column = slot === "second" ? "second_cleaner_id" : "assigned_cleaner_id";

  if (!bookingId || (!cleanerId && slot === "primary")) {
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

  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json(
      { ok: false, error: `Can't dispatch a ${booking.status} booking.` },
      { status: 400 }
    );
  }

  if (slot === "second" && !booking.assigned_cleaner_id) {
    return NextResponse.json(
      { ok: false, error: "Assign the first cleaner before adding a second." },
      { status: 400 }
    );
  }

  const otherSlotId = slot === "second" ? booking.assigned_cleaner_id : booking.second_cleaner_id;
  if (cleanerId && otherSlotId && otherSlotId === cleanerId) {
    return NextResponse.json(
      { ok: false, error: "That cleaner is already on this job." },
      { status: 400 }
    );
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

  const previousCleanerId: string | null = booking[column] ?? null;

  // Tell a cleaner who was already texted the job that they're off it.
  async function notifyOff(cleanerIdOff: string) {
    const { data: previousCleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", cleanerIdOff)
      .single();
    if (!previousCleaner?.phone) return false;
    const result = await sendSms({
      to: previousCleaner.phone,
      body: `REASSIGNED — you're off ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix}. No need to go.`,
      cleanerId: previousCleaner.id,
      bookingId,
      recipientType: "cleaner",
      eventType: "reassigned",
    });
    return result.ok;
  }

  // ── Remove the second cleaner ──────────────────────────────────────────
  if (slot === "second" && !cleanerId) {
    if (!previousCleanerId) {
      return NextResponse.json({ ok: true, removed: false });
    }
    const { error: clearErr } = await supabaseAdmin
      .from("bookings")
      .update({ second_cleaner_id: null })
      .eq("id", bookingId);
    if (clearErr) {
      console.error("[dispatch] clear second cleaner failed:", clearErr);
      return NextResponse.json({ ok: false, error: clearErr.message }, { status: 500 });
    }
    const previousCleanerNotified = booking.dispatch_sms_sent_at
      ? await notifyOff(previousCleanerId)
      : false;
    return NextResponse.json({ ok: true, removed: true, previousCleanerNotified });
  }

  // ── Assign / replace a cleaner in this slot ────────────────────────────
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

  // Switching cleaners on an already-dispatched job — tell the old cleaner they're off it
  const isReassignment =
    previousCleanerId && previousCleanerId !== cleanerId && booking.dispatch_sms_sent_at;

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({
      [column]: cleanerId,
      status: booking.status === "in_progress" ? "in_progress" : "confirmed",
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[dispatch] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Name the teammate in the job text so each cleaner knows it's a 2-person job.
  let teammateLine = "";
  if (otherSlotId) {
    const { data: teammate } = await supabaseAdmin
      .from("cleaners")
      .select("first_name")
      .eq("id", otherSlotId)
      .single();
    if (teammate?.first_name) teammateLine = `\n2-person job — with ${teammate.first_name}`;
  }

  const body = `New job — ${serviceDate} ${timeRange}
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms}BR · ${booking.service_summary}${teammateLine}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`;

  const smsResult = await sendSms({
    to: cleaner.phone,
    body,
    cleanerId,
    bookingId,
    recipientType: "cleaner",
    eventType: "dispatch",
  });

  // Only stamp dispatch_sms_sent_at when the cleaner actually got the text —
  // downstream flows (reminders, cancel/reschedule notices) key off it.
  if (smsResult.ok) {
    await supabaseAdmin
      .from("bookings")
      .update({ dispatch_sms_sent_at: new Date().toISOString() })
      .eq("id", bookingId);
  }

  // When a second cleaner joins a job the primary was already texted about,
  // let the primary know they now have a teammate.
  let teammateNotified = false;
  if (slot === "second" && booking.dispatch_sms_sent_at && booking.assigned_cleaner_id) {
    const { data: primary } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", booking.assigned_cleaner_id)
      .single();
    if (primary?.phone) {
      const result = await sendSms({
        to: primary.phone,
        body: `TEAM UPDATE — ${cleaner.first_name} is joining you on ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix}.`,
        cleanerId: primary.id,
        bookingId,
        recipientType: "cleaner",
        eventType: "other",
      });
      teammateNotified = result.ok;
    }
  }

  const previousCleanerNotified = isReassignment ? await notifyOff(previousCleanerId!) : false;

  return NextResponse.json({
    ok: true,
    slot,
    previousCleanerNotified,
    teammateNotified,
    smsSent: smsResult.ok,
    smsError: smsResult.ok ? null : smsResult.errorMessage,
  });
}
