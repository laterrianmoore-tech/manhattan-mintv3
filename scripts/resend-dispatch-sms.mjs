// One-off: resend the dispatch SMS for a booking whose original send silently failed.
// Composes the same message body as /api/dispatch and sends via OpenPhone, logging to dispatch_log.
// Run: node scripts/resend-dispatch-sms.mjs <bookingId>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");
const bookingId = process.argv[2];
if (!bookingId) {
  console.error("Usage: node scripts/resend-dispatch-sms.mjs <bookingId>");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: booking, error: bErr } = await supabase
  .from("bookings")
  .select("*, customers(*)")
  .eq("id", bookingId)
  .single();
if (bErr || !booking) {
  console.error("booking not found:", bErr?.message);
  process.exit(1);
}
if (!booking.assigned_cleaner_id) {
  console.error("booking has no assigned cleaner");
  process.exit(1);
}

const { data: cleaner, error: cErr } = await supabase
  .from("cleaners")
  .select("id, first_name, phone, portal_token")
  .eq("id", booking.assigned_cleaner_id)
  .single();
if (cErr || !cleaner) {
  console.error("cleaner not found:", cErr?.message);
  process.exit(1);
}

const customer = booking.customers;
const serviceDate = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeRange = Array.isArray(booking.preferred_time_ranges)
  ? booking.preferred_time_ranges.join(", ")
  : booking.preferred_time_ranges || "";
const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";

const body = `New job — ${serviceDate} ${timeRange}
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms}BR · ${booking.service_summary}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`;

console.log(`Sending dispatch SMS to ${cleaner.first_name} (${maskPhone(cleaner.phone)}) for booking ${bookingId}`);
console.log(`Body length: ${body.length} chars`);

const res = await fetch("https://api.openphone.com/v1/messages", {
  method: "POST",
  headers: {
    Authorization: env.OPENPHONE_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: env.OPENPHONE_FROM_NUMBER,
    to: [cleaner.phone],
    content: body,
  }),
});

const data = await res.json().catch(() => ({}));
const ok = res.ok;
console.log(`OpenPhone HTTP ${res.status} ${ok ? "OK" : "FAILED"}`);
if (!ok) console.log("Error response:", JSON.stringify(data).slice(0, 500));
else console.log("Message id:", data?.data?.id, "| status:", data?.data?.status);

await supabase.from("dispatch_log").insert({
  cleaner_id: cleaner.id,
  booking_id: bookingId,
  recipient_type: "cleaner",
  to_phone: cleaner.phone,
  message_body: body,
  openphone_message_id: data?.data?.id ?? null,
  event_type: "dispatch",
  status: ok ? "sent" : "failed",
  error_message: ok ? null : JSON.stringify(data).slice(0, 500),
});
console.log("dispatch_log row inserted.");
