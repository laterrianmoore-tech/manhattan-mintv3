import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { google } from "googleapis";

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
};

function parseGooglePrivateKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  return raw.replace(/\\n/g, "\n");
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

    if (!body.serviceDate || !body.firstName || !body.lastName || !body.email || !body.phone || !body.address) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
    }

    if (body.serviceDate < minAllowedServiceDate()) {
      return NextResponse.json({ error: "Service date must be at least 2 days from today" }, { status: 400 });
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const googleServiceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const googlePrivateKey = parseGooglePrivateKey();
    const integrations = {
      emailConfigured: Boolean(sendgridApiKey && sendgridFrom),
      calendarConfigured: Boolean(calendarId && googleServiceEmail && googlePrivateKey),
    };

    const fullName = `${body.firstName} ${body.lastName}`.trim();
    const fullAddress = `${body.address}${body.aptNo ? `, Apt ${body.aptNo}` : ""}`;
    const isHourlyBooking = Boolean(body.serviceSummary?.startsWith("Hourly clean"));
    const extrasLabel = body.selectedExtras.length
      ? body.selectedExtras.map((x) => `${x.label} ($${x.price})`).join(", ")
      : "None";

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
      `Key Access: ${body.keyAccess ? "Yes" : "No"}`,
      `Access Notes: ${body.accessNotes || "-"}`,
      `Cleaning Notes: ${body.cleaningNotes || "-"}`,
      `Coupon: ${body.couponCode || "None"}`,
      `Payment Method: card`,
      `Stripe Payment Method ID: ${body.stripePaymentMethodId || "n/a"}`,
      `Card Charge Timing: ${body.cardChargeTiming || "AFTER appointment"}`,
      `Booking Total: $${body.pricing.total}`,
      `Next Clean Total: $${body.pricing.nextCleanTotal ?? body.pricing.total}`,
    ].join("\n");

    if (integrations.calendarConfigured) {
      const auth = new google.auth.JWT({
        email: googleServiceEmail,
        key: googlePrivateKey,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const calendar = google.calendar({ version: "v3", auth });

      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `New Cleaning Booking - ${fullName}`,
          description: eventDescription,
          location: fullAddress,
          start: { date: body.serviceDate },
          end: { date: addOneDay(body.serviceDate) },
        },
      });
    }

    if (integrations.emailConfigured) {
      sgMail.setApiKey(sendgridApiKey as string);

      const internalTo = process.env.SENDGRID_TO_EMAIL || sendgridFrom;

      await sgMail.send({
        to: body.email,
        from: sendgridFrom as string,
        subject: "Booking Received - Manhattan Mint",
        html: `
          <h2>Thanks for booking with Manhattan Mint, ${body.firstName}!</h2>
          <p>We received your booking for <strong>${body.serviceDate}</strong>.</p>
          <p><strong>Service:</strong> ${body.serviceSummary || `${body.bedrooms} BR / ${body.bathrooms} BA`}, ${body.frequency}</p>
          <p><strong>Address:</strong> ${fullAddress}</p>
          <p><strong>Extras:</strong> ${extrasLabel}</p>
          <p><strong>Total:</strong> $${body.pricing.total}</p>
          <p><strong>Next clean recurring total:</strong> $${body.pricing.nextCleanTotal ?? body.pricing.total}</p>
          <p>Payment method: Card on file (charged after appointment).</p>
        `,
      });

      await sgMail.send({
        to: internalTo as string,
        from: sendgridFrom as string,
        subject: `New Booking - ${fullName}`,
        text: eventDescription,
      });
    }

    console.log("booking submitted", {
      customer: fullName,
      serviceDate: body.serviceDate,
      address: fullAddress,
      total: body.pricing.total,
      paymentMethod: "card",
      integrations,
    });

    return NextResponse.json({ ok: true, integrations });
  } catch (error) {
    console.error("booking submit error", error);
    return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
  }
}
