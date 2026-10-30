import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { sendSms } from "@/lib/openphone";

export const maxDuration = 30;

// Housekeeping quote request from /housekeeping (2026-10-30). Recurring
// light-touch visits (2-3x a week: beds, laundry, dishes, tidying) are
// quoted by the owner per home, never booked straight from the site, so
// this only emails + texts the owner and sends the requester a short
// acknowledgement. Nothing is stored server-side beyond the emails.

const FROM_NAME = "Manhattan Mint";
const SITE = "https://manhattanmintnyc.com";

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  forWhom?: string;
  neighborhood?: string;
  bedrooms?: string;
  bathrooms?: string;
  visitsPerWeek?: string;
  needs?: string[];
  startDate?: string;
  duration?: string;
  notes?: string;
  company?: string; // honeypot
};

const clean = (v: unknown, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (clean(body.company)) return NextResponse.json({ ok: true }); // bot; pretend success

    const name = clean(body.name, 120);
    const email = clean(body.email, 160);
    const phone = clean(body.phone, 40);
    const forWhom = clean(body.forWhom, 60);
    const neighborhood = clean(body.neighborhood, 120);
    const bedrooms = clean(body.bedrooms, 20);
    const bathrooms = clean(body.bathrooms, 20);
    const visitsPerWeek = clean(body.visitsPerWeek, 40);
    const needs = Array.isArray(body.needs) ? body.needs.map((n) => clean(n, 60)).filter(Boolean).slice(0, 12) : [];
    const startDate = clean(body.startDate, 60);
    const duration = clean(body.duration, 60);
    const notes = String(body.notes ?? "").trim().slice(0, 2000);

    if (!name || !email || !phone || !neighborhood) {
      return NextResponse.json({ error: "Name, email, phone and neighborhood are required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Please enter a phone number we can reach you at." }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL;
    const ownerEmails = (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || "hello@manhattanmintnyc.com")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);

    const summary = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Who it's for: ${forWhom || "-"}`,
      `Neighborhood: ${neighborhood}`,
      `Home: ${bedrooms || "?"} BR / ${bathrooms || "?"} BA`,
      `Visits per week: ${visitsPerWeek || "-"}`,
      `Needs: ${needs.length ? needs.join(", ") : "-"}`,
      `Start: ${startDate || "-"}`,
      `How long: ${duration || "-"}`,
      `Notes: ${notes || "-"}`,
    ];

    let ownerEmail: "sent" | "failed" = "failed";
    let ownerSms: "sent" | "failed" = "failed";

    if (apiKey && from) {
      sgMail.setApiKey(apiKey);
      const results = await Promise.allSettled([
        sgMail.send({
          to: ownerEmails,
          from: { email: from, name: process.env.SENDGRID_FROM_NAME || FROM_NAME },
          replyTo: { email, name },
          subject: `Housekeeping quote request — ${name}, ${neighborhood} (${visitsPerWeek || "?"}/wk)`,
          text: [`New housekeeping quote request from ${SITE}/housekeeping`, ``, ...summary, ``, `Reply to this email to reach ${name} directly.`].join("\n"),
        }),
        sgMail.send({
          to: { email, name },
          from: { email: from, name: process.env.SENDGRID_FROM_NAME || FROM_NAME },
          replyTo: { email: "hello@manhattanmintnyc.com", name: FROM_NAME },
          subject: "Got your housekeeping request",
          text: [
            `Hi ${name.split(" ")[0]},`,
            ``,
            `Thanks for reaching out. We have your housekeeping request for ${neighborhood} and will come back to you with a quote and available days, usually within a few hours.`,
            ``,
            `What you sent:`,
            ...summary.filter((l) => !l.startsWith("Name:") && !l.startsWith("Email:") && !l.startsWith("Phone:")).map((l) => `  ${l}`),
            ``,
            `Need to add anything? Just reply to this email, or call or text (914) 863-7902.`,
            ``,
            `Manhattan Mint Luxury Cleaning`,
            `${SITE}`,
          ].join("\n"),
        }),
      ]);
      ownerEmail = results[0].status === "fulfilled" ? "sent" : "failed";
      if (results[0].status === "rejected") console.error("[housekeeping] owner email failed", results[0].reason);
      if (results[1].status === "rejected") console.error("[housekeeping] ack email failed", results[1].reason);
    } else {
      console.error("[housekeeping] SendGrid not configured");
    }

    if (ownerPhones.length) {
      const smsBody = `HOUSEKEEPING QUOTE REQUEST: ${name}, ${neighborhood}, ${bedrooms || "?"}BR/${bathrooms || "?"}BA, ${visitsPerWeek || "?"} visits/wk, start ${startDate || "TBD"}${forWhom && forWhom !== "Me" ? ` (for ${forWhom.toLowerCase()})` : ""}. Ph: ${phone}, ${email}. Details in your inbox.`;
      const r = await Promise.allSettled(
        ownerPhones.map((to) => sendSms({ to, body: smsBody, bookingId: null, cleanerId: null, recipientType: "customer", eventType: "other" })),
      );
      ownerSms = r.some((x) => x.status === "fulfilled" && x.value.ok) ? "sent" : "failed";
    }

    if (ownerEmail !== "sent" && ownerSms !== "sent") {
      return NextResponse.json({ error: "We couldn't send your request right now. Please text (914) 863-7902 or email hello@manhattanmintnyc.com." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[housekeeping] request error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again or text (914) 863-7902." }, { status: 500 });
  }
}
