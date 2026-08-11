// One-off: what's on the books for tomorrow, and has the campaign gone out this week?
// Run: node scripts/check-tomorrow-0811.mjs   (reads .env.local, prints NO raw PII)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const initials = (a, b) => `${(a || "?")[0] || "?"}.${(b || "?")[0] || "?"}.`;
const maskPhone = (p) => (p ? `***${String(p).slice(-4)}` : "-");

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const todayNY = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const tomorrowNY = new Date(Date.now() + 864e5).toLocaleDateString("en-CA", {
  timeZone: "America/New_York",
});
console.log(`today(NY)=${todayNY}  tomorrow(NY)=${tomorrowNY}\n`);

console.log("=== Upcoming bookings (service_date >= today) ===");
const { data: up, error: upErr } = await supabase
  .from("bookings")
  .select(
    "id, status, service_date, preferred_time_ranges, pricing_total, cleaning_notes, assigned_cleaner_id, dispatch_sms_sent_at, completed_at, customers(first_name, last_name, phone)"
  )
  .gte("service_date", todayNY)
  .order("service_date", { ascending: true });
if (upErr) console.log("error:", upErr.message);
for (const b of up || []) {
  const c = b.customers;
  console.log(
    `${b.service_date} | ${initials(c?.first_name, c?.last_name)} ${maskPhone(c?.phone)} | ${
      Array.isArray(b.preferred_time_ranges) ? b.preferred_time_ranges.join(",") : b.preferred_time_ranges || "-"
    } | $${b.pricing_total} | status=${b.status} | cleaner=${b.assigned_cleaner_id ? "ASSIGNED" : "NONE"} | dispatch_sms=${b.dispatch_sms_sent_at || "never"} | id=${b.id}`
  );
  const tag = (b.cleaning_notes || "").match(/\[Arrival window: ([^\]]+)\]/)?.[1];
  if (tag) console.log(`    arrival window tag: ${tag}`);
}

console.log("\n=== Cleaner for tomorrow's assigned jobs ===");
for (const b of (up || []).filter((b) => b.service_date === tomorrowNY && b.assigned_cleaner_id)) {
  // Same columns /api/reminders reads — there is no `active` column on cleaners.
  const { data: cl, error: clErr } = await supabase
    .from("cleaners")
    .select("first_name, phone, portal_token")
    .eq("id", b.assigned_cleaner_id)
    .single();
  if (clErr) console.log(`  ${b.id} -> cleaner lookup failed: ${clErr.message}`);
  else
    console.log(
      `  ${b.id} -> ${cl?.first_name} ${maskPhone(cl?.phone)} portal_token=${cl?.portal_token ? "set" : "MISSING"}`
    );
}

console.log("\n=== campaign_sends: most recent 12 ===");
const { data: cs, error: csErr } = await supabase
  .from("campaign_sends")
  .select("created_at, campaign_key, email")
  .order("created_at", { ascending: false })
  .limit(12);
if (csErr) console.log("error:", csErr.message);
const seen = {};
for (const r of cs || []) {
  const day = String(r.created_at).slice(0, 10);
  seen[`${day} ${r.campaign_key}`] = (seen[`${day} ${r.campaign_key}`] || 0) + 1;
}
for (const [k, v] of Object.entries(seen)) console.log(`  ${k} x${v}`);
