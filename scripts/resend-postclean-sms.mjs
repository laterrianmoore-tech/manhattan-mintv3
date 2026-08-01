// One-off: check + resend the post-clean texts (review link, recurring/referral upsell)
// for a completed booking whose sends failed during the Aug 1 credit outage.
// Run: node scripts/resend-postclean-sms.mjs <bookingId>          (check only)
//      node scripts/resend-postclean-sms.mjs <bookingId> --send   (actually resend)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");
const toE164 = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(phone || "").startsWith("+") ? String(phone) : `+${digits}`;
};

const bookingId = process.argv[2];
const doSend = process.argv.includes("--send");
if (!bookingId) {
  console.error("Usage: node scripts/resend-postclean-sms.mjs <bookingId> [--send]");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);

const { data: booking, error } = await supabase
  .from("bookings")
  .select("id, status, service_date, completed_at, assigned_cleaner_id, customers(first_name, phone)")
  .eq("id", bookingId)
  .single();
if (error || !booking) {
  console.error("booking not found:", error?.message);
  process.exit(1);
}
if (booking.status !== "completed") {
  console.error(`booking status is ${booking.status}, not completed — refusing`);
  process.exit(1);
}
const customer = booking.customers;
const custPhone = toE164(customer.phone);
console.log(`Booking ${bookingId} | ${customer.first_name[0]}. | phone ${maskPhone(custPhone)} | completed ${booking.completed_at}`);

// What has this customer already received?
const pnRes = await fetch("https://api.openphone.com/v1/phone-numbers", { headers: { Authorization: env.OPENPHONE_API_KEY } });
const pn = ((await pnRes.json()).data || []).find((p) => p.number === env.OPENPHONE_FROM_NUMBER);
const msgRes = await fetch(
  `https://api.openphone.com/v1/messages?phoneNumberId=${pn.id}&participants[]=${encodeURIComponent(custPhone)}&maxResults=20`,
  { headers: { Authorization: env.OPENPHONE_API_KEY } }
);
const msgs = await msgRes.json();
if (!msgRes.ok) {
  console.log("openphone list HTTP", msgRes.status, JSON.stringify(msgs).slice(0, 200));
} else {
  console.log(`Existing messages to this customer: ${(msgs.data || []).length}`);
  for (const m of msgs.data || []) {
    console.log(`  ${m.createdAt} | ${m.direction} | ${m.status} | ${String(m.text || "").slice(0, 60).replace(/\n/g, " / ")}`);
  }
  const alreadyGotReview = (msgs.data || []).some((m) => m.direction === "outgoing" && /feedback\//.test(m.text || ""));
  if (alreadyGotReview) {
    console.log("Review text ALREADY delivered — not resending. Remove this guard only if you're sure.");
    process.exit(0);
  }
}

// Hardcoded on purpose — .env.local has NEXT_PUBLIC_SITE_URL=localhost, which
// must NEVER end up in a real text (happened 2026-08-01).
const siteUrl = "https://manhattanmintnyc.com";
const texts = [
  {
    eventType: "completed",
    body: `Hi ${customer.first_name} — your Manhattan Mint clean is complete! 💚 How did we do? It takes 30 seconds and means the world to our team: ${siteUrl}/feedback/${bookingId}`,
  },
  {
    eventType: "other",
    body: `Loved the clean? Lock it in — reply WEEKLY, BIWEEKLY, or MONTHLY and save up to 30% on every clean. Same great cleaner, zero rebooking. Plus: refer a friend and you BOTH get $25 off your next clean. — Manhattan Mint NYC`,
  },
];

if (!doSend) {
  console.log("\nDry run — would send the 2 post-clean texts above. Re-run with --send to send.");
  process.exit(0);
}

for (const t of texts) {
  const res = await fetch("https://api.openphone.com/v1/messages", {
    method: "POST",
    headers: { Authorization: env.OPENPHONE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.OPENPHONE_FROM_NUMBER, to: [custPhone], content: t.body }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`${t.eventType}: HTTP ${res.status} ${res.ok ? "OK id=" + data?.data?.id : JSON.stringify(data).slice(0, 200)}`);
  await supabase.from("dispatch_log").insert({
    cleaner_id: booking.assigned_cleaner_id,
    booking_id: bookingId,
    recipient_type: "customer",
    to_phone: custPhone,
    message_body: t.body,
    openphone_message_id: data?.data?.id ?? null,
    event_type: t.eventType,
    status: res.ok ? "sent" : "failed",
    error_message: res.ok ? null : JSON.stringify(data).slice(0, 300),
  });
}
