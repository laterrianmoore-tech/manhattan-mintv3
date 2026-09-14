import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { renderCleanReminderEmail } from "@/lib/email/clean-reminder";

export const dynamic = "force-dynamic";

// A clean is recurring unless it's a one-off. Stored values are inconsistent
// ("One-Time" and "one_time" both exist), so compare on a stripped form.
const isRecurring = (frequency: string | null | undefined) => {
  const f = (frequency ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return f.length > 0 && f !== "onetime";
};

// Called once a day by the Netlify scheduled function (netlify/functions/job-reminders.mjs).
// Texts every dispatched cleaner a reminder for tomorrow's jobs, and emails the
// customer on recurring bookings. Cleaner texts are deduped by the schedule
// itself; customer emails are claimed via bookings.reminder_email_sent_at, so a
// repeated invocation can't send the same reminder twice.
// ?remindBooking=<id> sends one customer reminder immediately, ignoring the
// date and frequency filters — for a manual send outside the daily run.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const remindBookingId = url.searchParams.get("remindBooking")?.trim() || null;

  // "Tomorrow" in New York, regardless of server timezone
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  // NEXT_PUBLIC_SITE_URL is localhost in .env.local. A customer-facing link must
  // never ship a localhost URL, so anything that isn't https falls back to prod.
  const candidateSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicSiteUrl = candidateSiteUrl.startsWith("https://")
    ? candidateSiteUrl
    : "https://manhattanmintnyc.com";

  const longDate = (isoDate: string) =>
    new Date(isoDate + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  // Emails one customer their day-before reminder. Claims the send first with a
  // conditional update — if another invocation already stamped
  // reminder_email_sent_at, the update matches no rows and we send nothing.
  // `force` skips the claim check for deliberate manual re-sends.
  async function sendCustomerReminder(bookingId: string, force = false, preview = false) {
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      // Deliberately does NOT select reminder_email_sent_at: the claim below is
      // a conditional update, so reading the column first buys nothing and would
      // fail the whole lookup on a database that hasn't added it yet.
      .select(
        "id, status, frequency, service_date, service_summary, bedrooms, bathrooms, preferred_time_ranges, cleaning_notes, pricing_total, customers(first_name, email)",
      )
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) return { ok: false, reason: bErr?.message ?? "booking not found" };

    const customer = booking.customers as any;
    if (!customer?.email) return { ok: false, reason: "customer has no email" };

    if (!force && !preview) {
      const claim = await supabaseAdmin
        .from("bookings")
        .update({ reminder_email_sent_at: new Date().toISOString() })
        .eq("id", booking.id)
        .is("reminder_email_sent_at", null)
        .select("id");
      if (claim.error) return { ok: false, reason: `claim failed: ${claim.error.message}` };
      if (!claim.data?.length) return { ok: false, reason: "already reminded" };
    }

    const { subject, html } = renderCleanReminderEmail({
      firstName: customer.first_name || "there",
      dateLabel: longDate(booking.service_date),
      arrivalWindow: (booking.cleaning_notes || "").match(/\[Arrival window: ([^\]]+)\]/)?.[1] ?? null,
      timeLabel: Array.isArray(booking.preferred_time_ranges)
        ? booking.preferred_time_ranges.join(", ")
        : booking.preferred_time_ranges || null,
      frequencyLabel: isRecurring(booking.frequency) ? booking.frequency : null,
      // service_summary already reads like "1 BR / 1 BA"; only build a label
      // from the room counts when it's missing.
      serviceLabel:
        booking.service_summary ||
        (booking.bedrooms != null && booking.bathrooms != null
          ? `${booking.bedrooms}BR · ${booking.bathrooms}BA`
          : null),
      total: booking.pricing_total ?? null,
      siteUrl: publicSiteUrl,
    });

    if (preview) {
      return {
        ok: true,
        preview: true,
        subject,
        to: `${customer.email[0]}***@${String(customer.email).split("@")[1]}`,
      };
    }

    // Blind-copy the owner so there's a record of every reminder in an inbox we
    // can actually open. The SendGrid key is mail-send only — it can't query
    // delivery, bounces, or suppressions — so this is the only way to confirm
    // from outside the dashboard that a reminder went out.
    const ownerCopy = (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
      await sgMail.send({
        to: customer.email,
        ...(ownerCopy.length ? { bcc: ownerCopy } : {}),
        from: {
          email: process.env.SENDGRID_FROM_EMAIL!,
          name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint",
        },
        subject,
        html,
      });
      if (force) {
        const stamp = await supabaseAdmin
          .from("bookings")
          .update({ reminder_email_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        if (stamp.error) {
          console.warn(`[reminders] sent but could not stamp booking ${booking.id}:`, stamp.error.message);
        }
      }
      return { ok: true };
    } catch (err: any) {
      // Hand the claim back so the daily run can try again.
      if (!force) {
        await supabaseAdmin
          .from("bookings")
          .update({ reminder_email_sent_at: null })
          .eq("id", booking.id);
      }
      console.error(`[reminders] customer email failed for booking ${booking.id}:`, err?.message ?? err);
      return { ok: false, reason: err?.message ?? "send failed" };
    }
  }

  // Manual single send — ignores the date and frequency filters.
  if (remindBookingId) {
    // ?dryRun=1 renders and reports without sending — safe way to check the
    // wiring without putting a second email in a customer's inbox.
    const previewOnly = url.searchParams.get("dryRun") === "1";
    const result = await sendCustomerReminder(remindBookingId, true, previewOnly);
    return NextResponse.json(
      { ...result, mode: "remindBooking", bookingId: remindBookingId },
      { status: result.ok ? 200 : 400 },
    );
  }

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, service_date, service_summary, bedrooms, preferred_time_ranges, cleaning_notes, assigned_cleaner_id, second_cleaner_id, dispatch_sms_sent_at, customers(first_name, address, apt_no)"
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
    // Both cleaners on a 2-person job get the reminder.
    const cleanerIds = [booking.assigned_cleaner_id, booking.second_cleaner_id].filter(
      (id): id is string => !!id
    );
    const { data: jobCleaners } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone, portal_token")
      .in("id", cleanerIds);

    const customer = booking.customers as any;
    const timeRange = Array.isArray(booking.preferred_time_ranges)
      ? booking.preferred_time_ranges.join(", ")
      : booking.preferred_time_ranges || "";
    const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
    // Surface an exact arrival window if one was stamped into the notes
    const arrivalTag = (booking.cleaning_notes || "").match(/\[Arrival window: ([^\]]+)\]/)?.[1];

    for (const cleaner of jobCleaners ?? []) {
      if (!cleaner?.phone) continue;
      const teammate = (jobCleaners ?? []).find((c) => c.id !== cleaner.id);
      const teammateLine = teammate ? `\n2-person job — with ${teammate.first_name}` : "";

      const result = await sendSms({
        to: cleaner.phone,
        body: `REMINDER — job tomorrow (${dateLabel})${timeRange ? ` ${timeRange}` : ""}${
          arrivalTag ? ` — arrive ${arrivalTag}` : ""
        }
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms ? `${booking.bedrooms}BR · ` : ""}${booking.service_summary}${teammateLine}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`,
        cleanerId: cleaner.id,
        bookingId: booking.id,
        recipientType: "cleaner",
        eventType: "reminder",
      });

      if (result.ok) sent++;
      results.push({ bookingId: booking.id, ok: result.ok });
    }
  }

  // Customer-side reminders for tomorrow's recurring cleans. Deliberately not
  // limited to dispatched jobs — the customer's appointment stands whether or
  // not a cleaner has been assigned yet.
  const emailResults: Array<{ bookingId: string; ok: boolean; reason?: string }> = [];
  const { data: recurringTomorrow, error: recErr } = await supabaseAdmin
    .from("bookings")
    .select("id, frequency")
    .eq("service_date", tomorrow)
    .eq("status", "confirmed");

  if (recErr) {
    // Never let the customer-email pass break the cleaner texts above.
    console.error("[reminders] recurring lookup failed:", recErr);
  } else {
    for (const booking of (recurringTomorrow ?? []).filter((b) => isRecurring(b.frequency))) {
      const result = await sendCustomerReminder(booking.id);
      emailResults.push({ bookingId: booking.id, ...result });
    }
  }

  const emailsSent = emailResults.filter((r) => r.ok).length;
  console.log(
    `[reminders] ${tomorrow}: cleaner texts ${sent}/${bookings?.length ?? 0}, customer emails ${emailsSent}/${emailResults.length}`,
  );

  return NextResponse.json({
    ok: true,
    date: tomorrow,
    jobs: bookings?.length ?? 0,
    sent,
    results,
    customerEmailsSent: emailsSent,
    customerEmails: emailResults,
  });
}
