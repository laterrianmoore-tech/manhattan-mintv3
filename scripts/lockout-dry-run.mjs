// Lockout flow dry run (2026-10-28): prints every text and the email the
// flow would send for one booking, without writing, charging or sending.
//
//   node scripts/lockout-dry-run.mjs <bookingId | customer first name> [baseUrl]
//
// Needs a running app (default http://localhost:3000) and .env.local. Goes
// through the real routes with the admin cookie:
//   POST /api/job-event/?dryRun=1  { event: "locked_out" }  → warning text + owner alert
//   POST /api/lockout/?dryRun=1    { action: "charge" }     → released + fee text, cleaner text, email
//   POST /api/lockout/?dryRun=1    { action: "waive" }      → no-fee text
// The email HTML is written to <temp dir>/lockout-email.html for a look in a browser.
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const [who, baseArg] = process.argv.slice(2);
if (!who) {
  console.error("usage: node scripts/lockout-dry-run.mjs <bookingId | customer first name> [baseUrl]");
  process.exit(1);
}
const base = (baseArg || "http://localhost:3000").replace(/\/$/, "");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY);

let bookingId = who;
if (!/^[0-9a-f-]{36}$/i.test(who)) {
  const { data: customers } = await sb.from("customers").select("id, first_name, last_name").ilike("first_name", who).limit(5);
  if (!customers?.length) { console.error(`No customer named ${who}`); process.exit(1); }
  const { data: bookings } = await sb
    .from("bookings")
    .select("id, service_date, status, pricing_total")
    .in("customer_id", customers.map((c) => c.id))
    .order("service_date", { ascending: false })
    .limit(1);
  if (!bookings?.length) { console.error(`No bookings for ${who}`); process.exit(1); }
  bookingId = bookings[0].id;
  console.log(`Booking ${bookingId} — ${customers[0].first_name} ${customers[0].last_name ?? ""} · ${bookings[0].service_date} · ${bookings[0].status} · $${bookings[0].pricing_total}\n`);
}

const headers = { "Content-Type": "application/json", Cookie: `mm_admin=${env.ADMIN_PASSWORD}` };
async function post(path, body) {
  const r = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`${path}: ${j.error ?? r.status}`);
  return j;
}
const rule = (t) => console.log(`\n━━ ${t} ${"━".repeat(Math.max(0, 70 - t.length))}`);

const lock = await post("/api/job-event/?dryRun=1", { bookingId, event: "locked_out" });
rule("1. Cleaner taps \"Can't get in\" → customer (final warning)");
console.log(lock.customerSms);
rule("   → owner");
console.log(lock.ownerSms);
if (!lock.migrated) console.log("\n(lockout columns not in the database yet — the real tap would refuse until the migration runs)");

const charge = await post("/api/lockout/?dryRun=1", { bookingId, action: "charge" });
rule("2a. Owner: Release cleaner + charge $119 → customer text");
console.log(charge.customerSms);
rule("    → cleaner text");
console.log(charge.cleanerSms);
rule("    → owner text");
console.log(charge.ownerSms);
rule(`    → customer email (${charge.email?.to ?? "no email on file"}) — subject: ${charge.email?.subject}`);
console.log(charge.email?.text);
console.log(`\n    plan: ${charge.summary}  (taxable: ${charge.taxable}, tax: $${charge.taxDollars}, total: $${charge.totalDollars})`);
if (charge.email?.html) {
  const out = join(tmpdir(), "lockout-email.html");
  writeFileSync(out, charge.email.html);
  console.log(`    email HTML written to ${out}`);
}

const waive = await post("/api/lockout/?dryRun=1", { bookingId, action: "waive" });
rule("2b. Owner: Release cleaner, waive fee → customer text");
console.log(waive.customerSms);
rule("    → owner text");
console.log(waive.ownerSms);
console.log("\nNothing was written, charged or sent.");
