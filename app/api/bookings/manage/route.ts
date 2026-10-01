import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { verifyManageToken } from "@/lib/manage-token";

// Customer self-serve: move a visit to another day, or (recurring plans only)
// skip this visit and keep the plan. Reached from the signed "Move or skip this
// visit" link in the day-before reminder email. No login: the HMAC token in the
// link is the proof of ownership.

const VALID_RANGES = ["Morning", "Midday", "Afternoon", "Evening"];
const MAX_DAYS_AHEAD = 120;

function nyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
// bookings.frequency is inconsistent ("One-Time", "one_time", "Bi-Weekly"...).
function normFrequency(f: unknown): string {
  return String(f || "").toLowerCase().replace(/[^a-z]/g, "");
}
function nextOccurrence(date: string, frequency: unknown): string | null {
  const f = normFrequency(frequency);
  if (f === "weekly") return addDays(date, 7);
  if (f === "biweekly") return addDays(date, 14);
  if (f === "every3weeks" || f === "triweekly") return addDays(date, 21);
  if (f === "monthly") return addMonths(date, 1);
  return null;
}
function fmt(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

async function loadBooking(id: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, status, frequency, service_date, service_summary, preferred_time_ranges, assigned_cleaner_id, second_cleaner_id, dispatch_sms_sent_at, customers(first_name, last_name, address, apt_no, phone)",
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

function summarize(b: NonNullable<Awaited<ReturnType<typeof loadBooking>>>) {
  const customer = b.customers as any;
  const changeable = (b.status === "confirmed" || b.status === "pending") && b.service_date >= nyToday();
  const skipTo = nextOccurrence(b.service_date, b.frequency);
  return {
    id: b.id,
    firstName: customer?.first_name || "there",
    date: b.service_date,
    dateLabel: fmt(b.service_date),
    status: b.status,
    frequency: b.frequency,
    serviceSummary: b.service_summary,
    timeRanges: Array.isArray(b.preferred_time_ranges) ? b.preferred_time_ranges : [],
    changeable,
    canSkip: changeable && !!skipTo,
    skipTo,
    skipToLabel: skipTo ? fmt(skipTo) : null,
    minDate: addDays(nyToday(), 1),
    maxDate: addDays(nyToday(), MAX_DAYS_AHEAD),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookingId = (url.searchParams.get("b") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  if (!verifyManageToken(bookingId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  const booking = await loadBooking(bookingId);
  if (!booking) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  return NextResponse.json({ ok: true, booking: summarize(booking) });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const bookingId = String(body?.bookingId || "").trim();
  const token = String(body?.token || "").trim();
  const action = body?.action === "skip" ? "skip" : "reschedule";
  if (!verifyManageToken(bookingId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }

  const booking = await loadBooking(bookingId);
  if (!booking) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  const summary = summarize(booking);
  if (!summary.changeable) {
    return NextResponse.json(
      { ok: false, error: "This visit can't be changed online any more. Text (914) 863-7902 and we'll sort it out." },
      { status: 400 },
    );
  }

  let newDate: string;
  let newTimeRanges: string[] | undefined;
  if (action === "skip") {
    if (!summary.skipTo) {
      return NextResponse.json({ ok: false, error: "Only recurring plans can skip a visit. Pick a new date instead." }, { status: 400 });
    }
    newDate = summary.skipTo;
  } else {
    newDate = String(body?.newDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return NextResponse.json({ ok: false, error: "Pick a date." }, { status: 400 });
    }
    if (newDate < summary.minDate || newDate > summary.maxDate) {
      return NextResponse.json(
        { ok: false, error: `Pick a day between ${fmt(summary.minDate)} and ${fmt(summary.maxDate)}. Need it sooner? Text (914) 863-7902.` },
        { status: 400 },
      );
    }
    if (body?.newTimeRanges !== undefined) {
      if (!Array.isArray(body.newTimeRanges) || body.newTimeRanges.some((r: unknown) => !VALID_RANGES.includes(String(r)))) {
        return NextResponse.json({ ok: false, error: "Bad time window." }, { status: 400 });
      }
      newTimeRanges = body.newTimeRanges.length ? body.newTimeRanges : undefined;
    }
  }
  if (newDate === booking.service_date && newTimeRanges === undefined) {
    return NextResponse.json({ ok: true, unchanged: true, booking: summary });
  }

  const updates: Record<string, unknown> = { service_date: newDate };
  if (newTimeRanges !== undefined) updates.preferred_time_ranges = newTimeRanges;
  const { error: updateErr } = await supabaseAdmin.from("bookings").update(updates).eq("id", bookingId);
  if (updateErr) {
    console.error("[manage] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: "Something went wrong saving that. Text (914) 863-7902 and we'll fix it." }, { status: 500 });
  }

  // A moved visit needs a fresh day-before reminder. Best-effort, the column
  // may be missing on an older database.
  const clearReminder = await supabaseAdmin.from("bookings").update({ reminder_email_sent_at: null }).eq("id", bookingId);
  if (clearReminder.error) console.warn("[manage] could not clear reminder stamp:", clearReminder.error.message);

  const customer = booking.customers as any;
  const oldDate = booking.service_date;
  const oldTimeRange = Array.isArray(booking.preferred_time_ranges) ? booking.preferred_time_ranges.join(", ") : "";
  const newTimeRange = newTimeRanges ? newTimeRanges.join(", ") : oldTimeRange;
  const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_SITE_URL : "https://manhattanmintnyc.com";
  const verb = action === "skip" ? "SKIPPED" : "MOVED";

  // Cleaner(s) hear about it only if they were dispatched for this job.
  const cleanerIds = [booking.assigned_cleaner_id, booking.second_cleaner_id].filter((id): id is string => !!id);
  if (cleanerIds.length && booking.dispatch_sms_sent_at) {
    const { data: jobCleaners } = await supabaseAdmin.from("cleaners").select("id, first_name, phone, portal_token").in("id", cleanerIds);
    for (const cleaner of jobCleaners ?? []) {
      if (!cleaner?.phone) continue;
      await sendSms({
        to: cleaner.phone,
        body: `RESCHEDULED by the client — ${customer?.first_name}'s job is now ${fmt(newDate)}${newTimeRange ? ` ${newTimeRange}` : ""} (was ${fmt(oldDate)}${oldTimeRange ? ` ${oldTimeRange}` : ""})
${customer?.address}${aptSuffix}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`,
        cleanerId: cleaner.id,
        bookingId: booking.id,
        recipientType: "cleaner",
        eventType: "rescheduled",
      });
    }
  }

  // Owner always hears about it.
  const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
  await Promise.allSettled(
    ownerPhones.map((phone) =>
      sendSms({
        to: phone,
        body: `CLIENT ${verb} VISIT: ${customer?.first_name} ${customer?.last_name || ""} ${fmt(oldDate)} → ${fmt(newDate)}${newTimeRange ? ` ${newTimeRange}` : ""}. ${booking.frequency || ""} ${booking.service_summary || ""}. Cleaner ${cleanerIds.length && booking.dispatch_sms_sent_at ? "texted" : "not dispatched yet"}.`,
        bookingId: booking.id,
        cleanerId: null,
        recipientType: "customer",
        eventType: "other",
      }),
    ),
  );

  const after = await loadBooking(bookingId);
  return NextResponse.json({ ok: true, action, newDate, booking: after ? summarize(after) : null });
}
