// Verify a weekly marketing run sent each recipient exactly ONE email.
// Run after any Tuesday send: node scripts/check-campaign-sends.mjs
// Emails are hashed, never printed — first-letter masking collapses distinct
// addresses and silently inflates per-recipient counts.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const id = (e) => createHash("sha256").update(e.trim().toLowerCase()).digest("hex").slice(0, 6);

const { data, error } = await supabase.from("campaign_sends").select("email, campaign_key, segment, sent_at");
if (error) {
  console.error("campaign_sends read failed:", error.message);
  process.exit(1);
}

const byDay = {};
for (const r of data) {
  const day = String(r.sent_at).slice(0, 10);
  byDay[day] = byDay[day] || { rows: 0, perPerson: {}, minutes: {} };
  byDay[day].rows++;
  byDay[day].perPerson[id(r.email)] = (byDay[day].perPerson[id(r.email)] || 0) + 1;
  const min = String(r.sent_at).slice(11, 16);
  byDay[day].minutes[min] = (byDay[day].minutes[min] || 0) + 1;
}

console.log("=== sends per day (want: rows === recipients, i.e. one email each) ===");
for (const day of Object.keys(byDay).sort()) {
  const d = byDay[day];
  const counts = Object.values(d.perPerson);
  const dupes = counts.filter((n) => n > 1).length;
  const runs = Object.entries(d.minutes)
    .map(([m, n]) => `${m}UTC x${n}`)
    .join(" ");
  const flag = dupes ? `  <-- ${dupes} recipient(s) DOUBLE-EMAILED` : "  ok";
  console.log(`${day}: ${d.rows} rows / ${counts.length} recipients | ${runs}${flag}`);
}

console.log("\n=== track depth (each track is 8 emails; recipients at 8 go silent) ===");
const per = {};
for (const r of data) per[id(r.email)] = (per[id(r.email)] || 0) + 1;
const depth = {};
for (const n of Object.values(per)) depth[n] = (depth[n] || 0) + 1;
for (const [n, people] of Object.entries(depth).sort((a, b) => a[0] - b[0])) {
  console.log(`  ${people} recipient(s) have received ${n} of 8`);
}
