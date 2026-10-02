import { NextResponse } from "next/server";
import { manageUrl } from "@/lib/manage-token";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { renderCleanReminderEmail } from "@/lib/email/clean-reminder";
import { trackedReviewUrl } from "@/lib/review-tracking";
import { hasActiveSubscription, HOLD_REFRESH_AFTER_DAYS, inspectHold, placeHold, releaseHold } from "@/lib/stripe-hold";

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
      manageUrl: manageUrl(booking.id, publicSiteUrl),
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

  // ── Day-3 Google review nudge ─────────────────────────────────────────
  // One short text to first-time customers who were sent the review link 3–4
  // days ago and never tapped it (review_link_clicked_at null), haven't been
  // nudged, and haven't been marked as reviewed. Built 2026-09-18 and OFF by
  // default: it sends only when REVIEW_NUDGE_ENABLED is exactly "true".
  //   ?reviewNudge=1            runs just this step (the daily run includes it too)
  //   ?reviewNudge=1&dryRun=1   lists who WOULD be texted, sends nothing —
  //                             works while the flag is off, to preview safely.
  // Each send is claimed via review_nudge_sent_at first, so a repeat run can't
  // text anyone twice; the claim is handed back if OpenPhone rejects the send.
  // Never offers anything in exchange for a review.
  const nudgeEnabled = process.env.REVIEW_NUDGE_ENABLED === "true";
  type NudgeResult = {
    bookingId: string;
    customer: string;
    action: "sent" | "would send" | "skipped" | "failed";
    reason?: string;
    body?: string;
  };
  async function runReviewNudge(dryRun: boolean) {
    const nowMs = Date.now();
    const windowStart = new Date(nowMs - 4 * 24 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(nowMs - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: candidates, error: candErr } = await supabaseAdmin
      .from("bookings")
      .select("id, customer_id, frequency, review_token, review_link_sent_at, customers(first_name, phone)")
      .eq("status", "completed")
      .gte("review_link_sent_at", windowStart)
      .lte("review_link_sent_at", windowEnd)
      .is("review_link_clicked_at", null)
      .is("review_nudge_sent_at", null)
      .is("review_received_at", null)
      .not("review_token", "is", null)
      .order("review_link_sent_at", { ascending: true });

    if (candErr) {
      // Most likely the 2026-09-18 review-tracking migration hasn't run.
      console.error("[reminders] review nudge lookup failed:", candErr.message);
      return { ok: false, enabled: nudgeEnabled, dryRun, error: candErr.message, candidates: 0, sent: 0, results: [] as NudgeResult[] };
    }

    const results: NudgeResult[] = [];
    let sent = 0;

    for (const b of candidates ?? []) {
      const customer = b.customers as any;
      const first = customer?.first_name || "there";
      const skip = (reason: string) => results.push({ bookingId: b.id, customer: first, action: "skipped", reason });

      // Same first-time rule /api/job-event applies to the review ask: not on
      // a recurring plan, and no other completed booking on the account.
      if (isRecurring(b.frequency)) { skip("recurring plan"); continue; }
      const { count } = await supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", b.customer_id)
        .eq("status", "completed")
        .neq("id", b.id);
      if ((count ?? 0) > 0) { skip("repeat customer"); continue; }

      // Owner rule (2026-10-01): only ask for a Google review from someone who
      // already told us privately that the clean was a 4 or 5. No rating, no ask.
      const { data: fb } = await supabaseAdmin
        .from("feedback")
        .select("rating")
        .eq("booking_id", b.id)
        .maybeSingle();
      const privateRating = fb && typeof (fb as any).rating === "number" ? ((fb as any).rating as number) : null;
      if (privateRating === null) { skip("no private rating yet"); continue; }
      if (privateRating < 4) { skip(`rated ${privateRating}/5 in private feedback`); continue; }

      if (!customer?.phone) { skip("no phone on file"); continue; }

      const link = trackedReviewUrl(b.review_token);
      const body = `Hi ${first}, Manhattan Mint here. If you have a spare minute, a quick Google review helps our small team more than you'd think: ${link}. Thank you either way!`;

      if (dryRun || !nudgeEnabled) {
        results.push({ bookingId: b.id, customer: first, action: "would send", body });
        continue;
      }

      const claim = await supabaseAdmin
        .from("bookings")
        .update({ review_nudge_sent_at: new Date().toISOString() })
        .eq("id", b.id)
        .is("review_nudge_sent_at", null)
        .select("id");
      if (claim.error) { results.push({ bookingId: b.id, customer: first, action: "failed", reason: `claim failed: ${claim.error.message}` }); continue; }
      if (!claim.data?.length) { skip("already nudged"); continue; }

      const res = await sendSms({
        to: customer.phone,
        body,
        bookingId: b.id,
        recipientType: "customer",
        eventType: "other",
      });
      if (res.ok) {
        sent++;
        results.push({ bookingId: b.id, customer: first, action: "sent" });
      } else {
        // Hand the claim back so the next run can try again.
        await supabaseAdmin.from("bookings").update({ review_nudge_sent_at: null }).eq("id", b.id);
        results.push({ bookingId: b.id, customer: first, action: "failed", reason: res.errorMessage ?? "send failed" });
      }
    }

    console.log(`[reminders] review nudge${dryRun ? " (dry run)" : ""}: ${sent} sent of ${candidates?.length ?? 0} candidates`);
    return { ok: true, enabled: nudgeEnabled, dryRun, candidates: candidates?.length ?? 0, sent, results };
  }

  // Nudge-only mode.
  if (url.searchParams.get("reviewNudge") === "1") {
    const dryRun = url.searchParams.get("dryRun") === "1";
    if (!nudgeEnabled && !dryRun) {
      return NextResponse.json(
        { ok: false, mode: "reviewNudge", enabled: false, error: 'REVIEW_NUDGE_ENABLED is not "true". Add &dryRun=1 to preview without sending.' },
        { status: 400 },
      );
    }
    const result = await runReviewNudge(dryRun);
    return NextResponse.json({ ...result, mode: "reviewNudge" }, { status: result.ok ? 200 : 500 });
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

  // ── Card holds for tomorrow ───────────────────────────────────────────
  // Every booking with a card gets a live authorization hold before the clean:
  // bookings made more than a week out (the booking-time hold expires), hand-
  // created and recurring auto-created bookings (never had one), and cards
  // added after booking. A declined hold texts the owner tonight, while there
  // is still time to collect another card — not after the clean is done.
  const holdResults: Array<{ bookingId: string; action: string; ok: boolean; detail?: string }> = [];
  try {
    const { data: tomorrowJobs, error: holdErr } = await supabaseAdmin
      .from("bookings")
      .select("id, service_date, service_summary, frequency, pricing_total, stripe_charge_id, stripe_customer_id, stripe_payment_method_id, customers(first_name, last_name, stripe_customer_id)")
      .eq("service_date", tomorrow)
      .in("status", ["pending", "confirmed"]);
    if (holdErr) throw new Error(holdErr.message);

    const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);

    for (const job of tomorrowJobs ?? []) {
      const customer = job.customers as any;
      const total: number = job.pricing_total ?? 0;
      const stripeCustomerId: string | null = job.stripe_customer_id || customer?.stripe_customer_id || null;
      if (total <= 0) { holdResults.push({ bookingId: job.id, action: "skip", ok: true, detail: "$0" }); continue; }
      if (!stripeCustomerId) { holdResults.push({ bookingId: job.id, action: "skip", ok: true, detail: "no card" }); continue; }

      const existing = await inspectHold(job.stripe_charge_id);
      if (existing.state === "captured") { holdResults.push({ bookingId: job.id, action: "skip", ok: true, detail: "already paid" }); continue; }
      if (existing.state === "held" && existing.ageDays < HOLD_REFRESH_AFTER_DAYS && existing.amount >= total) {
        holdResults.push({ bookingId: job.id, action: "keep", ok: true, detail: `$${existing.amount}, ${existing.ageDays.toFixed(1)}d old` });
        continue;
      }
      if (await hasActiveSubscription(stripeCustomerId)) { holdResults.push({ bookingId: job.id, action: "skip", ok: true, detail: "subscription" }); continue; }

      // Stale (near expiry) or short hold: release it and place a fresh one.
      if (existing.state === "held") await releaseHold(existing.paymentIntentId);

      const hold = await placeHold({
        stripeCustomerId,
        paymentMethodId: job.stripe_payment_method_id,
        amount: total,
        description: `Manhattan Mint clean — ${job.service_date} (${job.service_summary || job.frequency})`,
        bookingId: job.id,
      });
      if (hold.ok) {
        const { error: stampErr } = await supabaseAdmin.from("bookings").update({ stripe_charge_id: hold.paymentIntentId }).eq("id", job.id);
        if (stampErr) {
          // Never leave an unrecorded hold on a customer's card.
          await releaseHold(hold.paymentIntentId);
          holdResults.push({ bookingId: job.id, action: existing.state === "held" ? "refresh" : "place", ok: false, detail: `could not record hold: ${stampErr.message}` });
          continue;
        }
        holdResults.push({ bookingId: job.id, action: existing.state === "held" ? "refresh" : "place", ok: true, detail: `$${hold.amount}` });
        continue;
      }

      // Hold failed. If the old hold was released above it is gone for good, so
      // clear the stale id either way and tell the owner tonight.
      if (existing.state === "held") await supabaseAdmin.from("bookings").update({ stripe_charge_id: null }).eq("id", job.id);
      if (hold.code === "no_payment_method") {
        // Invoice-pay clients (Stripe customer, no card). The owner already
        // collects these by hand; no alert needed.
        holdResults.push({ bookingId: job.id, action: "skip", ok: true, detail: "no card on Stripe customer" });
        continue;
      }
      holdResults.push({ bookingId: job.id, action: "place", ok: false, detail: `${hold.declined ? "DECLINED" : "error"}: ${hold.error}` });
      const name = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() || "customer";
      for (const phone of ownerPhones) {
        await sendSms({
          to: phone,
          body: hold.declined
            ? `⚠️ CARD DECLINED for tomorrow's clean: ${name}, $${total} (${hold.code || "declined"}). Job is still on. Get another card on file before the clean or collect by invoice: node scripts/card-on-file.mjs link ${stripeCustomerId}`
            : `⚠️ Could not place the $${total} card hold for ${name}'s clean tomorrow (${hold.error.slice(0, 80)}). Job Complete will still try a normal charge.`,
          bookingId: job.id,
          cleanerId: null,
          recipientType: "customer",
          eventType: "other",
        });
      }
    }
  } catch (err: any) {
    // The hold pass must never break the reminders above.
    console.error("[reminders] hold pass threw:", err?.message ?? err);
    holdResults.push({ bookingId: "-", action: "pass", ok: false, detail: err?.message ?? "unknown error" });
  }
  console.log(`[reminders] ${tomorrow}: holds`, holdResults.map((r) => `${r.bookingId.slice(0, 8)} ${r.action} ${r.ok ? "ok" : "FAIL"} ${r.detail ?? ""}`).join(" | "));

  // Day-3 review nudge rides the same daily run. Gated by REVIEW_NUDGE_ENABLED
  // and never allowed to break the reminders above.
  let reviewNudge: Record<string, unknown> = { enabled: false, skipped: true };
  if (nudgeEnabled) {
    try {
      reviewNudge = await runReviewNudge(false);
    } catch (err: any) {
      console.error("[reminders] review nudge step threw:", err?.message ?? err);
      reviewNudge = { enabled: true, ok: false, error: err?.message ?? "unknown error" };
    }
  }

  return NextResponse.json({
    ok: true,
    date: tomorrow,
    jobs: bookings?.length ?? 0,
    sent,
    results,
    customerEmailsSent: emailsSent,
    customerEmails: emailResults,
    holds: holdResults,
    reviewNudge,
  });
}
