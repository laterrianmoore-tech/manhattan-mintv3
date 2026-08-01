// One-off: did the post-clean texts (review + upsell) go out for Vicky's last completed job
// (customer phone containing 571)? Prints redacted info only.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const initials = (a, b) => `${(a || "?")[0] || "?"}.${(b || "?")[0] || "?"}.`;
const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);

console.log("=== Bookings completed in the last 3 days ===");
const { data: bookings, error } = await supabase
  .from("bookings")
  .select("id, service_date, status, completed_at, complete_sms_sent_at, stripe_charge_id, pricing_total, frequency, customer_id, assigned_cleaner_id, customers(first_name, last_name, phone), cleaners:assigned_cleaner_id(first_name)")
  .eq("status", "completed")
  .gte("service_date", new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10))
  .order("completed_at", { ascending: false });
if (error) console.log("error:", error.message);
for (const b of bookings || []) {
  const c = b.customers;
  console.log(
    `${b.id}\n  ${initials(c?.first_name, c?.last_name)} ${maskPhone(c?.phone)} | svc ${b.service_date} | $${b.pricing_total} | freq=${b.frequency} | cleaner=${b.cleaners?.first_name} | completed_at=${b.completed_at} | complete_sms_sent_at=${b.complete_sms_sent_at || "NEVER"} | charge=${b.stripe_charge_id ? "charged" : "NOT CHARGED"}`
  );
}

const target = (bookings || []).find((b) => String(b.customers?.phone || "").includes("571"));
if (!target) {
  console.log("\nNo completed booking with a customer phone containing 571 found.");
  process.exit(0);
}
console.log(`\n=== OpenPhone messages to ${maskPhone(target.customers.phone)} ===`);
const pnRes = await fetch("https://api.openphone.com/v1/phone-numbers", { headers: { Authorization: env.OPENPHONE_API_KEY } });
const pns = await pnRes.json();
const pn = (pns.data || []).find((p) => p.number === env.OPENPHONE_FROM_NUMBER) || (pns.data || [])[0];
const msgRes = await fetch(
  `https://api.openphone.com/v1/messages?phoneNumberId=${pn.id}&participants[]=${encodeURIComponent(target.customers.phone)}&maxResults=20`,
  { headers: { Authorization: env.OPENPHONE_API_KEY } }
);
const msgs = await msgRes.json();
if (!msgRes.ok) console.log("openphone HTTP", msgRes.status, JSON.stringify(msgs).slice(0, 300));
for (const m of msgs.data || []) {
  console.log(`${m.createdAt} | ${m.direction} | status=${m.status} | ${String(m.text || "").slice(0, 70).replace(/\n/g, " / ")}`);
}
if (!(msgs.data || []).length) console.log("(no messages ever sent to this customer on this line)");
