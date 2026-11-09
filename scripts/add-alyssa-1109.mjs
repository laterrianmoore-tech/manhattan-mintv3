// One-off (2026-11-09): owner says Alyssa has finished onboarding (Stripe Connect payouts enabled,
// background check + agreement done) — add her to the cleaner roster, active, Manhattan, hours 9am–1pm.
// Her Connect account acct_1UZutNQCxuT7LHiH was created 2026-11-09 (see resend-alyssa-connect-link-1109.mts).
// Name comes from the Stripe account (Alyssa Andino). Prints masked contact details only.
//   node scripts/add-alyssa-1109.mjs          -> dry run
//   node scripts/add-alyssa-1109.mjs --apply  -> insert (or update the existing row if one appeared)
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const mask = (p) => (p ? String(p).replace(/\d(?=\d{4})/g, "*") : "-");
const maskEmail = (e) => (e ? e.replace(/^(.).*(@.*)$/, "$1***$2") : "-");

const NEW = {
  first_name: "Alyssa",
  last_name: "Andino",
  email: "lisandino88@gmail.com",
  phone: "+13474231104",
  status: "active",
  zones: ["Manhattan"],
  pay_rate_pct: 0.57, // same as Erika / Luz / Veronica; actual pay is set per job at dispatch
  stripe_account_id: "acct_1UZutNQCxuT7LHiH",
};
const HOURS = "9am–1pm"; // cleaners.available_hours (migration 2026-11-09-cleaner-available-hours.sql)

const { data: existing, error: lookErr } = await sb
  .from("cleaners")
  .select("id, first_name, last_name, email, phone, status, stripe_account_id")
  .or(`email.ilike.${NEW.email},phone.eq.${NEW.phone},stripe_account_id.eq.${NEW.stripe_account_id}`);
if (lookErr) { console.error(lookErr); process.exit(1); }
console.log("existing rows matching email/phone/Stripe:", existing.length);
for (const c of existing) console.log("  ", c.status, c.first_name, (c.last_name || "")[0] + ".", maskEmail(c.email), mask(c.phone), "stripe:", c.stripe_account_id ? "yes" : "no");
console.log("will write:", { ...NEW, email: maskEmail(NEW.email), phone: mask(NEW.phone), available_hours: HOURS });

if (!APPLY) { console.log("dry run — add --apply"); process.exit(0); }

let row, err, hoursSaved = true;
if (existing.length === 1) {
  const patch = { ...NEW, available_hours: HOURS, updated_at: new Date().toISOString() };
  ({ data: row, error: err } = await sb.from("cleaners").update(patch).eq("id", existing[0].id).select("id, first_name, status").single());
  if (err && /available_hours/i.test(err.message)) {
    hoursSaved = false;
    delete patch.available_hours;
    ({ data: row, error: err } = await sb.from("cleaners").update(patch).eq("id", existing[0].id).select("id, first_name, status").single());
  }
} else if (existing.length === 0) {
  const ins = { ...NEW, available_hours: HOURS, portal_token: randomBytes(16).toString("hex") };
  ({ data: row, error: err } = await sb.from("cleaners").insert(ins).select("id, first_name, status").single());
  if (err && /available_hours/i.test(err.message)) {
    hoursSaved = false;
    delete ins.available_hours;
    ({ data: row, error: err } = await sb.from("cleaners").insert(ins).select("id, first_name, status").single());
  }
} else {
  console.error("more than one matching row — sort out by hand"); process.exit(1);
}
if (err) { console.error("ERROR", err.message); process.exit(1); }
console.log(existing.length ? "updated" : "inserted", row.first_name, row.status, row.id);
if (!hoursSaved) console.log("NOTE: cleaners.available_hours is not in the live DB yet — hours NOT saved. Paste lib/supabase/migrations/2026-11-09-cleaner-available-hours.sql (it also sets Alyssa's hours).");
