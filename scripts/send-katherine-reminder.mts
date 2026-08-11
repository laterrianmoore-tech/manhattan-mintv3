// One-off: Katherine's day-before reminder for the Aug 12 monthly clean.
// Same template the nightly job uses. Run: npx tsx scripts/send-katherine-reminder.ts
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import { renderCleanReminderEmail } from "../src/lib/email/clean-reminder";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

// NEVER take the site URL from env here — .env.local points at localhost.
const SITE_URL = "https://manhattanmintnyc.com";
const BOOKING_ID = "fe2cffad-013d-435f-948a-b0f5789afd66";

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const { data: b, error } = await supabase
  .from("bookings")
  .select("id, status, frequency, service_date, service_summary, preferred_time_ranges, cleaning_notes, pricing_total, customers(first_name, email)")
  .eq("id", BOOKING_ID)
  .single();
if (error || !b) throw new Error(`booking lookup failed: ${error?.message}`);

const customer = b.customers as any;
const { subject, html } = renderCleanReminderEmail({
  firstName: customer.first_name,
  dateLabel: new Date(b.service_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
  arrivalWindow: (b.cleaning_notes || "").match(/\[Arrival window: ([^\]]+)\]/)?.[1] ?? null,
  timeLabel: Array.isArray(b.preferred_time_ranges) ? b.preferred_time_ranges.join(", ") : b.preferred_time_ranges,
  frequencyLabel: b.frequency,
  serviceLabel: b.service_summary,
  total: b.pricing_total,
  siteUrl: SITE_URL,
});

if (/localhost/i.test(html)) throw new Error("ABORT: localhost link in email body");
console.log(`to ${customer.email[0]}***@${customer.email.split("@")[1]} | booking ${b.status} ${b.service_date} | ${subject}`);

sgMail.setApiKey(env.SENDGRID_API_KEY);
const [res] = await sgMail.send({
  to: customer.email,
  from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME || "Manhattan Mint" },
  subject,
  html,
});
console.log(`SendGrid HTTP ${res.statusCode} — 202 means accepted for delivery`);
