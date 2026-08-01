// One-off: the Aug 1 resend scripts read NEXT_PUBLIC_SITE_URL from .env.local (localhost)
// and sent dead links. Send corrected production links to Vicky (portal) and Carina (review).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const SITE = "https://manhattanmintnyc.com"; // hardcoded on purpose — never trust local env for links

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");
const toE164 = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(phone || "").startsWith("+") ? String(phone) : `+${digits}`;
};

const { data: vicky } = await supabase
  .from("cleaners").select("id, phone, portal_token").ilike("first_name", "%vick%").single();
const { data: booking } = await supabase
  .from("bookings").select("id, assigned_cleaner_id, customers(first_name, phone)")
  .eq("id", "598000c2-ef3f-4aae-9707-3bcdf773fc4c").single();

const sends = [
  {
    label: "Vicky corrected portal link",
    to: toE164(vicky.phone),
    cleanerId: vicky.id,
    bookingId: "d5400a37-3bd8-4625-afa2-21ec083b5622",
    recipientType: "cleaner",
    eventType: "dispatch",
    body: `Sorry — the link in the last job text was broken. Use this one: ${SITE}/cleaner/${vicky.portal_token}`,
  },
  {
    label: "Carina corrected review link",
    to: toE164(booking.customers.phone),
    cleanerId: booking.assigned_cleaner_id,
    bookingId: booking.id,
    recipientType: "customer",
    eventType: "completed",
    body: `Apologies, ${booking.customers.first_name.trim()} — that review link was broken. Here's the right one: ${SITE}/feedback/${booking.id}`,
  },
];

for (const s of sends) {
  const res = await fetch("https://api.openphone.com/v1/messages", {
    method: "POST",
    headers: { Authorization: env.OPENPHONE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.OPENPHONE_FROM_NUMBER, to: [s.to], content: s.body }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`${s.label} → ${maskPhone(s.to)}: HTTP ${res.status} ${res.ok ? "OK id=" + data?.data?.id : JSON.stringify(data).slice(0, 200)}`);
  await supabase.from("dispatch_log").insert({
    cleaner_id: s.cleanerId,
    booking_id: s.bookingId,
    recipient_type: s.recipientType,
    to_phone: s.to,
    message_body: s.body,
    openphone_message_id: data?.data?.id ?? null,
    event_type: s.eventType,
    status: res.ok ? "sent" : "failed",
    error_message: res.ok ? null : JSON.stringify(data).slice(0, 300),
  });
}
