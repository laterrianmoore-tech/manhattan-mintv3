// One-off diagnostic: why didn't Vicky get the dispatch text for the Omran job?
// Run: node scripts/diagnose-omran-sms.mjs   (reads .env.local, prints NO raw PII)
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

console.log("=== 1. Customers matching 'omran' ===");
const { data: custs, error: cErr } = await supabase
  .from("customers")
  .select("id, first_name, last_name, phone")
  .or("first_name.ilike.%omran%,last_name.ilike.%omran%");
if (cErr) console.log("customers error:", cErr.message);
for (const c of custs || []) {
  console.log(`${c.id} | ${initials(c.first_name, c.last_name)} (name matches) | ${maskPhone(c.phone)}`);
}

console.log("\n=== 2. Their bookings ===");
const custIds = (custs || []).map((c) => c.id);
let bookings = [];
if (custIds.length) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, created_at, status, service_date, preferred_time_ranges, pricing_total, assigned_cleaner_id, dispatch_sms_sent_at")
    .in("customer_id", custIds)
    .order("created_at", { ascending: false });
  if (error) console.log("bookings error:", error.message);
  bookings = data || [];
  for (const b of bookings) {
    console.log(
      `${b.id}\n  svc ${b.service_date} ${JSON.stringify(b.preferred_time_ranges)} | $${b.pricing_total} | status=${b.status} | cleaner=${b.assigned_cleaner_id || "UNASSIGNED"} | dispatch_sms_sent_at=${b.dispatch_sms_sent_at || "NEVER"}`
    );
  }
} else {
  console.log("(no customer matched — nothing to check)");
}

console.log("\n=== 3. Vicky's cleaner row ===");
const { data: cleaners, error: clErr } = await supabase
  .from("cleaners")
  .select("id, first_name, last_name, phone, portal_token")
  .ilike("first_name", "%vick%");
if (clErr) console.log("cleaners error:", clErr.message);
for (const cl of cleaners || []) {
  console.log(
    `${cl.id} | ${initials(cl.first_name, cl.last_name)} | phone=${maskPhone(cl.phone)} (full length: ${cl.phone ? String(cl.phone).length : 0}, starts with: ${cl.phone ? String(cl.phone).slice(0, 2) : "-"}) | portal_token=${cl.portal_token ? "set" : "MISSING"}`
  );
}

console.log("\n=== 4. dispatch_log for those bookings (SELECT may be denied) ===");
if (bookings.length) {
  const { data: logs, error: lErr } = await supabase
    .from("dispatch_log")
    .select("created_at, recipient_type, event_type, status, to_phone, error_message, openphone_message_id")
    .in("booking_id", bookings.map((b) => b.id))
    .order("created_at", { ascending: false });
  if (lErr) console.log("dispatch_log error:", lErr.message);
  for (const l of logs || []) {
    console.log(
      `${l.created_at} | ${l.recipient_type}/${l.event_type} | ${l.status} | to=${maskPhone(l.to_phone)} | opId=${l.openphone_message_id || "-"} | err=${l.error_message ? l.error_message.slice(0, 300) : "-"}`
    );
  }
}

console.log("\n=== 5. OpenPhone: recent messages to Vicky's number ===");
try {
  const vicky = (cleaners || [])[0];
  if (!vicky?.phone) throw new Error("no vicky phone");
  const pnRes = await fetch("https://api.openphone.com/v1/phone-numbers", {
    headers: { Authorization: env.OPENPHONE_API_KEY },
  });
  const pns = await pnRes.json();
  const pn = (pns.data || []).find((p) => p.number === env.OPENPHONE_FROM_NUMBER) || (pns.data || [])[0];
  if (!pn) throw new Error("no OpenPhone number found: " + JSON.stringify(pns).slice(0, 200));
  console.log(`(using OpenPhone line ${maskPhone(pn.number)}, id ${pn.id})`);
  const msgRes = await fetch(
    `https://api.openphone.com/v1/messages?phoneNumberId=${pn.id}&participants[]=${encodeURIComponent(vicky.phone)}&maxResults=15`,
    { headers: { Authorization: env.OPENPHONE_API_KEY } }
  );
  const msgs = await msgRes.json();
  if (!msgRes.ok) {
    console.log("openphone messages HTTP", msgRes.status, JSON.stringify(msgs).slice(0, 300));
  } else {
    for (const m of msgs.data || []) {
      console.log(`${m.createdAt} | ${m.direction} | status=${m.status} | ${String(m.text || "").slice(0, 60).replace(/\n/g, " / ")}...`);
    }
    if (!(msgs.data || []).length) console.log("(no messages found to this number on this line)");
  }
} catch (e) {
  console.log("openphone check failed:", e.message);
}
