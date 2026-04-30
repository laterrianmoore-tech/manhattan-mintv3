import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { google } from "googleapis";
import Stripe from "stripe";

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
  date.setDate(date.getDate() + 2);
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
      return NextResponse.json({ error: "Service date must be at least 2 days from today" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const { email: googleServiceEmail, privateKey: googlePrivateKey } = getGoogleCredentials();

    const integrations = {
      stripeConfigured: Boolean(stripeKey),
      emailConfigured: Boolean(sendgridApiKey && sendgridFrom),
      calendarConfigured: Boolean(calendarId && googleServiceEmail && googlePrivateKey),
    };

    const fullName = `${body.firstName} ${body.lastName}`.trim();
    const fullAddress = `${body.address}${body.aptNo ? `, Apt ${body.aptNo}` : ""}`;
    const isHourlyBooking = Boolean(body.serviceSummary?.startsWith("Hourly clean"));
    const extrasLabel = body.selectedExtras.length
      ? body.selectedExtras.map((x) => `${x.label} ($${x.price})`).join(", ")
      : "None";

    // Run Stripe customer creation and Google Calendar in parallel — non-fatal if either fails
    const hasStripePaymentMethod =
      integrations.stripeConfigured &&
      body.stripePaymentMethodId &&
      body.stripePaymentMethodId !== "pending-stripe-setup";

    const [stripeResult, calendarResult] = await Promise.allSettled([
      hasStripePaymentMethod
        ? (async () => {
            const stripe = new Stripe(stripeKey as string, { apiVersion: "2026-02-25.clover" });
            const customer = await stripe.customers.create({
              name: fullName,
              email: body.email,
              phone: body.phone,
              payment_method: body.stripePaymentMethodId,
              invoice_settings: { default_payment_method: body.stripePaymentMethodId },
              metadata: {
                address: fullAddress,
                serviceDate: body.serviceDate,
                frequency: body.frequency,
                bookingTotal: String(body.pricing.total),
              },
            });
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
            await calendar.events.insert({
              calendarId,
              requestBody: {
                summary: `New Cleaning Booking - ${fullName}`,
                location: fullAddress,
                description: "", // filled below after we have stripeCustomerId
                ...getCalendarTimes(body.serviceDate, body.preferredTimeRanges),
              },
            });
          })()
        : Promise.resolve(undefined),
    ]);

    const stripeCustomerId =
      stripeResult.status === "fulfilled" ? (stripeResult.value as string | undefined) : undefined;

    if (stripeResult.status === "rejected") {
      console.error("Stripe customer creation failed (booking still saved):", stripeResult.reason);
    }
    if (calendarResult.status === "rejected") {
      console.error("Google Calendar error (booking still saved):", calendarResult.reason);
    }

    const eventDescription = [
      `Customer: ${fullName}`,
      `Email: ${body.email}`,
      `Phone: ${body.phone}`,
      `SMS Reminder: ${body.smsReminder ? "Yes" : "No"}`,
      `Address: ${fullAddress}`,
      `Frequency: ${body.frequency}`,
      `Service: ${body.serviceSummary || `${body.bedrooms} BR / ${body.bathrooms} BA`}`,
      ...(!isHourlyBooking ? [`Bedrooms: ${body.bedrooms}`, `Bathrooms: ${body.bathrooms}`] : []),
      `Extras: ${extrasLabel}`,
      `Preferred Time: ${body.preferredTimeRanges?.length ? body.preferredTimeRanges.join(", ") : "Flexible"}`,
      `Key Access: ${body.keyAccess ? "Yes" : "No"}`,
      `Access Notes: ${body.accessNotes || "-"}`,
      `Cleaning Notes: ${body.cleaningNotes || "-"}`,
      `Coupon: ${body.couponCode || "None"}`,
      `Payment Method: card`,
      `Stripe Payment Method ID: ${body.stripePaymentMethodId || "n/a"}`,
      `Stripe Customer ID: ${stripeCustomerId || "n/a"}`,
      `Card Charge Timing: ${body.cardChargeTiming || "AFTER appointment"}`,
      `Booking Total: $${body.pricing.total}`,
      `Next Clean Total: $${body.pricing.nextCleanTotal ?? body.pricing.total}`,
    ].join("\n");

    if (integrations.emailConfigured) {
      sgMail.setApiKey(sendgridApiKey as string);
      const internalTo = process.env.SENDGRID_TO_EMAIL || sendgridFrom;
      const serviceLabel = body.serviceSummary || `${body.bedrooms} BR / ${body.bathrooms} BA`;

      await sgMail.send({
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

          <p style="margin:0 0 6px;color:#555;font-size:14px;">💳 <strong>Payment:</strong> Your card is on file and will be charged after your appointment is complete.</p>
          ${body.frequency !== "One-Time" ? `<p style="margin:0 0 24px;color:#555;font-size:14px;">🔁 <strong>Recurring rate:</strong> $${body.pricing.nextCleanTotal ?? body.pricing.total} per clean starting with your second visit.</p>` : `<p style="margin:0 0 24px;"></p>`}

          <p style="margin:0;color:#888;font-size:13px;">Questions? Reply to this email or text us at <a href="tel:+16466200747" style="color:#2d6a4f;">(646) 620-0747</a>.</p>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">Manhattan Mint NYC LLC · New York, NY · <a href="https://www.manhattanmintnyc.com" style="color:#aaa;">manhattanmintnyc.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      await sgMail.send({
        to: internalTo as string,
        from: { email: sendgridFrom as string, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
        subject: `New Booking — ${fullName} · ${body.serviceDate}`,
        text: eventDescription,
      });
    }

    console.log("booking submitted", {
      customer: fullName,
      serviceDate: body.serviceDate,
      address: fullAddress,
      total: body.pricing.total,
      stripeCustomerId,
      calendarCreated: calendarResult.status === "fulfilled",
      integrations,
    });

    return NextResponse.json({ ok: true, integrations });
  } catch (error) {
    console.error("booking submit error", error);
    return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
  }
}
