import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { google } from "googleapis";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendSms } from "@/lib/openphone";

export const maxDuration = 30;

type SubmittedBooking = {
  frequency: string;
  bedrooms: number;
  bathrooms: number;
  selectedExtras: Array<{ label: string; price: number }>;
  serviceDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsReminder: boolean;
  address: string;
  aptNo: string;
  keyAccess: boolean;
  accessNotes: string;
  cleaningNotes: string;
  couponCode: string;
  paymentMethod?: "card";
  termsAccepted: boolean;
  pricing: {
    total: number;
    subtotal: number;
    frequencyDiscount: number;
    coupon: number;
    nextCleanTotal?: number;
  };
  serviceSummary?: string;
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  cardChargeTiming?: string;
  preferredTimeRanges?: string[];
};

function getGoogleCredentials() {
  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return { email: parsed.client_email as string, privateKey: parsed.private_key as string };
    } catch {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  return { email, privateKey: raw.replace(/\\n/g, "\n") };
}

const TIME_RANGE_MAP: Record<string, { start: string; end: string }> = {
  "Morning":   { start: "08:00", end: "12:00" },
  "Midday":    { start: "10:00", end: "14:00" },
  "Afternoon": { start: "12:00", end: "16:00" },
  "Evening":   { start: "16:00", end: "19:00" },
};

function getRecurrenceRule(frequency: string): string[] | undefined {
  if (frequency === "Weekly") return ["RRULE:FREQ=WEEKLY"];
  if (frequency === "Bi-Weekly") return ["RRULE:FREQ=WEEKLY;INTERVAL=2"];
  if (frequency === "Monthly") return ["RRULE:FREQ=WEEKLY;INTERVAL=4"];
  return undefined;
}

function getCalendarTimes(serviceDate: string, preferredTimeRanges?: string[]) {
  if (preferredTimeRanges?.length === 1) {
    const times = TIME_RANGE_MAP[preferredTimeRanges[0]];
    if (times) {
      return {
        start: { dateTime: `${serviceDate}T${times.start}:00`, timeZone: "America/New_York" },
        end:   { dateTime: `${serviceDate}T${times.end}:00`,   timeZone: "America/New_York" },
      };
    }
  }
  return {
    start: { date: serviceDate },
    end:   { date: addOneDay(serviceDate) },
  };
}

function addOneDay(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function minAllowedServiceDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmittedBooking;

    if (!body.termsAccepted) {
      return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
    }

    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.address || !body.serviceDate) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
    }

    if (body.serviceDate < minAllowedServiceDate()) {
      return NextResponse.json({ error: "Service date must be at least 1 day from today" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://manhattanmintnyc.com";
    const { email: googleServiceEmail, privateKey: googlePrivateKey } = getGoogleCredentials();

    const integrations = {
      stripeConfigured: Boolean(stripeKey),
      emailConfigured: Boolean(sendgridApiKey && sendgridFrom),
      calendarConfigured: Boolean(calendarId && googleServiceEmail && googlePrivateKey),
    };

    // ── Duplicate guard ──────────────────────────────────────────────────────
    // If this customer already saved a booking for the same service date in the
    // last 2 hours, treat this as a retry of the same booking. Prevents the
    // duplicate calendar events / bookings that happen when a customer clicks
    // "Save Booking" again after a transient error.
    try {
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", body.email)
        .maybeSingle();

      if (existingCustomer) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data: recentDup } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("customer_id", existingCustomer.id)
          .eq("service_date", body.serviceDate)
          .gte("created_at", twoHoursAgo)
          .limit(1);

        if (recentDup?.length) {
          console.log("Duplicate booking retry detected — returning existing booking", recentDup[0].id);
          return NextResponse.json({ ok: true, bookingId: recentDup[0].id, duplicate: true });
        }
      }
    } catch (dupErr) {
      console.error("Duplicate check failed (continuing with booking):", dupErr);
    }

    const fullName = `${body.firstName} ${body.lastName}`.trim();
    const fullAddress = `${body.address}${body.aptNo ? `, Apt ${body.aptNo}` : ""}`;
    const isHourlyBooking = Boolean(body.serviceSummary?.startsWith("Hourly clean"));
    const extrasLabel = body.selectedExtras.length
      ? body.selectedExtras.map((x) => `${x.label} ($${x.price})`).join(", ")
      : "None";

    const hasCardOnFile = Boolean(
      integrations.stripeConfigured && body.stripePaymentMethodId && body.stripeCustomerId
    );

    // ── Stripe + Google Calendar in parallel — non-fatal if either fails ────
    // Card saved at checkout: update the customer created in create-setup-intent
    // with full booking metadata and set the confirmed card as default.
    // No card saved (card entry failed / Stripe blocked in customer's browser):
    // create a customer anyway and generate a Checkout link (setup mode) so the
    // customer can add their card from a plain hosted Stripe page.
    let cardSetupUrl: string | undefined;

    const [stripeResult, calendarResult] = await Promise.allSettled([
      integrations.stripeConfigured
        ? (async () => {
            const stripe = new Stripe(stripeKey as string, { apiVersion: "2026-02-25.clover" });
            if (hasCardOnFile) {
              await stripe.customers.update(body.stripeCustomerId as string, {
                name: fullName,
                phone: body.phone,
                invoice_settings: { default_payment_method: body.stripePaymentMethodId },
                metadata: {
                  address: fullAddress,
                  serviceDate: body.serviceDate,
                  frequency: body.frequency,
                  bookingTotal: String(body.pricing.total),
                },
              });
              return body.stripeCustomerId;
            }
            const customer = await stripe.customers.create({
              email: body.email,
              name: fullName,
              phone: body.phone,
              metadata: {
                address: fullAddress,
                serviceDate: body.serviceDate,
                frequency: body.frequency,
                bookingTotal: String(body.pricing.total),
                cardCapture: "pending — link sent at booking",
              },
            });
            const session = await stripe.checkout.sessions.create({
              mode: "setup",
              customer: customer.id,
              payment_method_types: ["card"],
              success_url: `${siteUrl}/thank-you?card=saved`,
              cancel_url: `${siteUrl}/thank-you`,
            });
            cardSetupUrl = session.url || undefined;
            return customer.id;
          })()
        : Promise.resolve(undefined),

      integrations.calendarConfigured
        ? (async () => {
            const auth = new google.auth.JWT({
              email: googleServiceEmail,
              key: googlePrivateKey,
              scopes: ["https://www.googleapis.com/auth/calendar"],
              subject: process.env.GOOGLE_CALENDAR_OWNER_EMAIL || "hello@manhattanmintnyc.com",
            });
            const calendar = google.calendar({ version: "v3", auth });
            const recurrence = getRecurrenceRule(body.frequency);
            const calendarDescription = [
              ...(!hasCardOnFile ? ["⚠️ NO CARD ON FILE — setup link sent to customer", ""] : []),
              `Customer: ${fullName}`,
              `Phone: ${body.phone}`,
              `Email: ${body.email}`,
              `Service: ${body.serviceSummary || `${body.bedrooms} BR / ${body.bathrooms} BA`}`,
              `Frequency: ${body.frequency}`,
              `Preferred Time: ${body.preferredTimeRanges?.length ? body.preferredTimeRanges.join(", ") : "Flexible"}`,
              `Extras: ${extrasLabel}`,
              ``,
              `Key Access: ${body.keyAccess ? "Yes" : "No"}`,
              `Access Notes: ${body.accessNotes || "-"}`,
              `Cleaning Notes: ${body.cleaningNotes || "-"}`,
              ``,
              `Total: $${body.pricing.total}`,
            ].join("\n");
            await calendar.events.insert({
              calendarId,
              requestBody: {
                summary: `${body.frequency !== "One-Time" ? "🔁 " : ""}${!hasCardOnFile ? "⚠️ " : ""}New Cleaning Booking - ${fullName}`,
                location: fullAddress,
                description: calendarDescription,
                ...getCalendarTimes(body.serviceDate, body.preferredTimeRanges),
                ...(recurrence ? { recurrence } : {}),
              },
            });
          })()
        : Promise.resolve(undefined),
    ]);

    const stripeCustomerId =
      stripeResult.status === "fulfilled" ? (stripeResult.value as string | undefined) : undefined;

    if (stripeResult.status === "rejected") {
      console.error("Stripe step failed (booking still saved):", stripeResult.reason);
    }
    if (calendarResult.status === "rejected") {
      console.error("Google Calendar error (booking still saved):", calendarResult.reason);
    }

    // ── Supabase: upsert customer + insert booking ──────────────────────────
    let supabaseBookingId: string | undefined;
    try {
      // Upsert customer by email — if they've booked before, update their latest info
      const { data: customer, error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert(
          {
            first_name: body.firstName,
            last_name: body.lastName,
            email: body.email,
            phone: body.phone,
            address: body.address,
            apt_no: body.aptNo || null,
            key_access: body.keyAccess,
            access_notes: body.accessNotes || null,
            sms_reminder: body.smsReminder,
            stripe_customer_id: stripeCustomerId || null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (customerError || !customer) {
        console.error("Supabase customer upsert failed:", customerError);
      } else {
        // Insert booking linked to this customer
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from("bookings")
          .insert({
            customer_id: customer.id,
            status: "pending",
            frequency: body.frequency,
            bedrooms: body.bedrooms || null,
            bathrooms: body.bathrooms || null,
            service_summary: body.serviceSummary || null,
            service_date: body.serviceDate,
            preferred_time_ranges: body.preferredTimeRanges || [],
            selected_extras: body.selectedExtras || [],
            cleaning_notes: body.cleaningNotes || null,
            coupon_code: body.couponCode || null,
            pricing_total: body.pricing.total,
            pricing_subtotal: body.pricing.subtotal,
            pricing_next_clean_total: body.pricing.nextCleanTotal ?? null,
            stripe_payment_method_id: body.stripePaymentMethodId || null,
            stripe_customer_id: stripeCustomerId || null,
          })
          .select("id")
          .single();

        if (bookingError || !booking) {
          console.error("Supabase booking insert failed:", bookingError);
        } else {
          supabaseBookingId = booking.id;
          console.log("Supabase booking saved:", supabaseBookingId);
        }
      }
    } catch (supabaseError) {
      // Non-fatal: notifications still go out even if Supabase write fails
      console.error("Supabase error (booking still processed):", supabaseError);
    }
    // ── End Supabase ────────────────────────────────────────────────────────

    // ── Notifications — ALL non-fatal, owner + customer, email + SMS ────────
    // The booking is already saved above. Nothing past this point may throw the
    // request into a 500: a notification failure must never make the customer
    // see an error (that is what caused retry-duplicates and missed jobs).
    const serviceLabel = body.serviceSummary || `${body.bedrooms} BR / ${body.bathrooms} BA`;
    const eventDescription = [
      ...(!hasCardOnFile ? ["⚠️ NO CARD ON FILE — customer was sent a secure card setup link", ""] : []),
      `Customer: ${fullName}`,
      `Email: ${body.email}`,
      `Phone: ${body.phone}`,
      `SMS Reminder: ${body.smsReminder ? "Yes" : "No"}`,
      `Address: ${fullAddress}`,
      `Frequency: ${body.frequency}`,
      `Service: ${serviceLabel}`,
      ...(!isHourlyBooking ? [`Bedrooms: ${body.bedrooms}`, `Bathrooms: ${body.bathrooms}`] : []),
      `Extras: ${extrasLabel}`,
      `Preferred Time: ${body.preferredTimeRanges?.length ? body.preferredTimeRanges.join(", ") : "Flexible"}`,
      `Key Access: ${body.keyAccess ? "Yes" : "No"}`,
      `Access Notes: ${body.accessNotes || "-"}`,
      `Cleaning Notes: ${body.cleaningNotes || "-"}`,
      `Coupon: ${body.couponCode || "None"}`,
      `Payment Method: card`,
      `Card On File: ${hasCardOnFile ? "Yes" : "NO — setup link sent"}`,
      ...(cardSetupUrl ? [`Card Setup Link: ${cardSetupUrl}`] : []),
      `Stripe Payment Method ID: ${body.stripePaymentMethodId || "n/a"}`,
      `Stripe Customer ID: ${stripeCustomerId || "n/a"}`,
      `Card Charge Timing: ${body.cardChargeTiming || "AFTER appointment"}`,
      `Booking Total: $${body.pricing.total}`,
      `Next Clean Total: $${body.pricing.nextCleanTotal ?? body.pricing.total}`,
    ].join("\n");

    if (integrations.emailConfigured) {
      sgMail.setApiKey(sendgridApiKey as string);
    }
    const internalRecipients = (process.env.SENDGRID_TO_EMAIL || sendgridFrom || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const paymentLineHtml = hasCardOnFile
      ? `<p style="margin:0 0 6px;color:#555;font-size:14px;">💳 <strong>Payment:</strong> Your card is on file and will be charged after your appointment is complete.</p>`
      : `<p style="margin:0 0 6px;color:#555;font-size:14px;">💳 <strong>Payment:</strong> We couldn't save a card during booking. Please add one securely here: <a href="${cardSetupUrl || `${siteUrl}/quote`}" style="color:#2d6a4f;">Add card</a>. Your card is only charged after your appointment.</p>`;

    const notificationResults = await Promise.allSettled([
      // 1. Owner alert email — FIRST priority
      integrations.emailConfigured && internalRecipients.length
        ? sgMail.send({
            to: internalRecipients,
            from: { email: sendgridFrom as string, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
            subject: `${hasCardOnFile ? "" : "⚠️ NO CARD — "}New Booking — ${fullName} · ${body.serviceDate} · $${body.pricing.total}`,
            text: eventDescription,
          })
        : Promise.reject(new Error("email not configured")),

      // 2. Owner alert SMS — independent of SendGrid, so booking alerts survive email outages.
      // OWNER_NOTIFY_PHONE supports a comma-separated list (e.g. personal cell + company line).
      ownerPhones.length
        ? Promise.all(
            ownerPhones.map((phone) =>
              sendSms({
                to: phone,
                body: `NEW BOOKING${hasCardOnFile ? "" : " (NO CARD!)"}: ${fullName}, ${body.serviceDate}, ${serviceLabel}, $${body.pricing.total}, ${fullAddress}. Ph: ${body.phone}`,
                bookingId: supabaseBookingId ?? null,
                cleanerId: null,
                recipientType: "customer",
                eventType: "other",
              }).then((r) => {
                if (!r.ok) throw new Error(r.errorMessage || `owner SMS to ${phone} failed`);
              })
            )
          )
        : Promise.reject(new Error("OWNER_NOTIFY_PHONE not set")),

      // 3. Customer confirmation email
      integrations.emailConfigured
        ? sgMail.send({
            to: body.email,
            from: { email: sendgridFrom as string, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
            subject: "Booking Confirmed — Manhattan Mint",
            html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#2d6a4f;padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.3px;">Manhattan Mint</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">NYC Residential Cleaning</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#0f0f0f;font-size:20px;font-weight:600;">You're all set, ${body.firstName}!</h2>
          <p style="margin:0 0 28px;color:#555;font-size:15px;">Your booking has been received. We'll see you on <strong>${body.serviceDate}</strong>.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <tr><td style="padding:5px 0;color:#555;font-size:14px;width:140px;">Service</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${serviceLabel}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Frequency</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${body.frequency}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Date</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${body.serviceDate}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Preferred Time</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${body.preferredTimeRanges?.length ? body.preferredTimeRanges.join(", ") : "Flexible"}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Address</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${fullAddress}</td></tr>
            ${body.selectedExtras.length ? `<tr><td style="padding:5px 0;color:#555;font-size:14px;vertical-align:top;">Extras</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${extrasLabel}</td></tr>` : ""}
            <tr><td style="padding:8px 0 0;color:#555;font-size:14px;border-top:1px solid #e0e0e0;">Total</td><td style="padding:8px 0 0;color:#2d6a4f;font-size:16px;font-weight:700;border-top:1px solid #e0e0e0;">$${body.pricing.total}</td></tr>
          </table>

          ${paymentLineHtml}
          ${body.frequency !== "One-Time" ? `<p style="margin:0 0 24px;color:#555;font-size:14px;">🔁 <strong>Recurring rate:</strong> $${body.pricing.nextCleanTotal ?? body.pricing.total} per clean starting with your second visit.</p>` : `<p style="margin:0 0 24px;"></p>`}

          <p style="margin:0;color:#888;font-size:13px;">Questions? Reply to this email or text us at <a href="tel:+16466200747" style="color:#2d6a4f;">(646) 620-0747</a>.</p>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">Manhattan Mint NYC LLC · New York, NY · <a href="https://manhattanmintnyc.com" style="color:#aaa;">manhattanmintnyc.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          })
        : Promise.reject(new Error("email not configured")),

      // 4. Customer confirmation SMS (includes card setup link when no card saved)
      body.phone
        ? sendSms({
            to: body.phone,
            body: hasCardOnFile
              ? `Thanks for booking Manhattan Mint, ${body.firstName}. If you need to cancel or reschedule, please give us at least 24 hours notice. — Manhattan Mint NYC`
              : `Thanks for booking Manhattan Mint, ${body.firstName}! One last step — add your card securely here (charged only after your clean): ${cardSetupUrl || siteUrl} — Manhattan Mint NYC`,
            bookingId: supabaseBookingId ?? null,
            cleanerId: null,
            recipientType: "customer",
            eventType: "other",
          }).then((r) => {
            if (!r.ok) throw new Error(r.errorMessage || "customer SMS failed");
          })
        : Promise.reject(new Error("no customer phone")),
    ]);

    const [ownerEmail, ownerSms, customerEmail, customerSms] = notificationResults.map((r) =>
      r.status === "fulfilled" ? "sent" : `failed: ${(r as PromiseRejectedResult).reason?.message || r}`
    );
    const notifications = { ownerEmail, ownerSms, customerEmail, customerSms };

    for (const [channel, result] of Object.entries(notifications)) {
      if (result !== "sent") console.error(`Notification ${channel} — ${result}`);
    }

    console.log("booking submitted", {
      customer: fullName,
      serviceDate: body.serviceDate,
      address: fullAddress,
      total: body.pricing.total,
      hasCardOnFile,
      cardSetupUrl: cardSetupUrl ? "generated" : "n/a",
      stripeCustomerId,
      supabaseBookingId,
      calendarCreated: calendarResult.status === "fulfilled",
      notifications,
      integrations,
    });

    return NextResponse.json({ ok: true, integrations, notifications, bookingId: supabaseBookingId });
  } catch (error) {
    console.error("booking submit error", error);
    return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
  }
}
