// One-off diagnostic: recent bookings, SMS log, SendGrid stats, Stripe setup intents.
// Run: node scripts/diagnose-bookings.mjs   (reads .env.local, prints NO secrets)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

// PII redaction — output shows initials/masked contact info only
const initials = (a, b) => `${(a || "?")[0] || "?"}.${(b || "?")[0] || "?"}.`;
const maskEmail = (e) => (e ? `${e[0]}***@${e.split("@")[1] || "?"}` : "-");
const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("=== 1. Last 10 bookings (Supabase) ===");
const { data: bookings, error: bErr } = await supabase
  .from("bookings")
  .select("id, created_at, status, service_date, pricing_total, stripe_payment_method_id, stripe_customer_id, customer_id, customers(first_name, last_name, email, phone)")
  .order("created_at", { ascending: false })
  .limit(10);
if (bErr) console.log("bookings error:", bErr.message);
for (const b of bookings || []) {
  const c = b.customers;
  console.log(
    `${b.created_at} | ${initials(c?.first_name, c?.last_name)} | svc ${b.service_date} | $${b.pricing_total} | status=${b.status} | pm=${b.stripe_payment_method_id ? "saved" : "MISSING"} | ${maskEmail(c?.email)}`
  );
}

console.log("\n=== 2. dispatch_log last 15 (did any SMS go out?) ===");
const { data: logs, error: lErr } = await supabase
  .from("dispatch_log")
  .select("created_at, recipient_type, event_type, status, to_phone, error_message, booking_id")
  .order("created_at", { ascending: false })
  .limit(15);
if (lErr) console.log("dispatch_log error:", lErr.message);
for (const l of logs || []) {
  console.log(
    `${l.created_at} | ${l.recipient_type}/${l.event_type} | ${l.status} | to=${maskPhone(l.to_phone)} | err=${l.error_message ? l.error_message.slice(0, 120) : "-"}`
  );
}

console.log("\n=== 3. SendGrid daily stats, last 14 days ===");
try {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
  const res = await fetch(
    `https://api.sendgrid.com/v3/stats?start_date=${start}&end_date=${end}&aggregated_by=day`,
    { headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}` } }
  );
  if (!res.ok) {
    console.log("sendgrid stats HTTP", res.status, (await res.text()).slice(0, 200));
  } else {
    const days = await res.json();
    for (const d of days) {
      const m = d.stats?.[0]?.metrics || {};
      if ((m.requests || 0) + (m.delivered || 0) + (m.blocks || 0) + (m.bounces || 0) > 0)
        console.log(`${d.date}: requests=${m.requests} delivered=${m.delivered} bounces=${m.bounces} blocks=${m.blocks} spam=${m.spam_reports}`);
    }
    console.log("(days with zero activity omitted)");
  }
} catch (e) {
  console.log("sendgrid stats failed:", e.message);
}

console.log("\n=== 4. Stripe SetupIntents, last 20 ===");
try {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const intents = await stripe.setupIntents.list({ limit: 20 });
  for (const si of intents.data) {
    const when = new Date(si.created * 1000).toISOString();
    console.log(
      `${when} | ${si.status} | ${maskEmail(si.metadata?.email)} | lastErr=${si.last_setup_error ? `${si.last_setup_error.code}: ${si.last_setup_error.message}`.slice(0, 140) : "-"}`
    );
  }
  console.log("mode:", env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE" : "TEST");
} catch (e) {
  console.log("stripe list failed:", e.message);
}
