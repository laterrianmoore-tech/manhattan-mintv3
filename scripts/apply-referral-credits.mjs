// Referral credits: when a friend's first clean (booked with a MINTxxxxxx friend
// code) is COMPLETED, the referrer gets $50 off their next upcoming booking.
// No new tables: the friend's booking carries the code in coupon_code, and the
// referrer's credited booking is marked coupon_code = REFCREDIT-<friend booking
// id prefix>, which is also how we know a credit was already applied.
//
//   node C:/Users/lmoore/manhattan-mint/scripts/apply-referral-credits.mjs           dry run
//   node C:/Users/lmoore/manhattan-mint/scripts/apply-referral-credits.mjs --apply   applies credits
//
// Referrers with no upcoming booking are listed as "pending" so the owner can
// honor the credit when they rebook (or a later run applies it automatically).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const CREDIT = 50;
const env = {};
for (const line of readFileSync(join(REPO, ".env.local"), "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const codeFor = (id) => "MINT" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
const mask = (s) => (s ? `${s[0]}***` : "-");
const today = new Date().toISOString().slice(0, 10);

const { data: customers, error: ce } = await sb.from("customers").select("id, first_name, last_name, phone");
if (ce) throw new Error(ce.message);
const byCode = Object.fromEntries(customers.map((c) => [codeFor(c.id), c]));

// Friend bookings: completed, coupon is a friend code.
const { data: friendBookings, error: fe } = await sb.from("bookings")
  .select("id, customer_id, coupon_code, service_date, status, pricing_total")
  .eq("status", "completed").like("coupon_code", "MINT______");
if (fe) throw new Error(fe.message);
const friends = (friendBookings ?? []).filter((b) => /^MINT[0-9A-F]{6}$/.test(b.coupon_code));

// Credits already applied anywhere.
const { data: credited } = await sb.from("bookings").select("id, customer_id, coupon_code").like("coupon_code", "REFCREDIT-%");
const appliedFor = new Set((credited ?? []).map((b) => b.coupon_code.replace("REFCREDIT-", "")));

let applied = 0, pending = 0, skipped = 0;
console.log(`${friends.length} completed friend-code booking(s) found.`);
for (const fb of friends) {
  const tag = fb.id.slice(0, 8);
  const referrer = byCode[fb.coupon_code];
  if (!referrer) { console.log(`  ${tag}: code ${fb.coupon_code} matches no customer — skip`); skipped++; continue; }
  if (referrer.id === fb.customer_id) { console.log(`  ${tag}: self-referral — skip`); skipped++; continue; }
  if (appliedFor.has(tag)) { skipped++; continue; }
  const { data: next } = await sb.from("bookings")
    .select("id, service_date, pricing_total, coupon_code")
    .eq("customer_id", referrer.id).in("status", ["pending", "confirmed"]).gte("service_date", today)
    .is("coupon_code", null).order("service_date", { ascending: true }).limit(1);
  const target = next?.[0];
  if (!target) {
    console.log(`  ${tag}: friend clean ${fb.service_date} → referrer ${mask(referrer.first_name)} ${mask(referrer.last_name)} has no upcoming booking — PENDING $${CREDIT} credit`);
    pending++; continue;
  }
  const newTotal = Math.max(0, Number(target.pricing_total) - CREDIT);
  console.log(`  ${tag}: friend clean ${fb.service_date} → credit $${CREDIT} to ${mask(referrer.first_name)} ${mask(referrer.last_name)}'s ${target.service_date} booking ($${target.pricing_total} → $${newTotal})`);
  if (APPLY) {
    const { error } = await sb.from("bookings").update({ pricing_total: newTotal, coupon_code: `REFCREDIT-${tag}` }).eq("id", target.id);
    if (error) { console.log(`     update failed: ${error.message}`); continue; }
    applied++;
  }
}
console.log(`\nReferral credits: ${applied} applied, ${pending} pending (no upcoming booking), ${skipped} skipped.${APPLY ? "" : " [dry run — add --apply]"}`);
