// Backfill (2026-10-08): cleaner pay + collected/fee for jobs completed before
// the ledger existed, so /admin/accounting starts with real history.
//
//   node scripts/backfill-cleaner-pay-1008.mjs --dry   # print what would change
//   node scripts/backfill-cleaner-pay-1008.mjs         # write it
//
// Requires lib/supabase/migrations/2026-10-08-cleaner-pay.sql to have run.
// Idempotent: a booking that already has cleaner_pay / collected_cents is left alone.
//
// Pay sources, in order:
//   1. KNOWN: amounts the owner texted (Quo threads) and the 10/1 payout run
//      in 04_Operations/job-log.md — stored as "manual" with the paid date.
//   2. Everything else: the pay table (src/lib/cleaner-pay.ts, mirrored
//      below) — stored as "estimate". Jobs on or before 2026-10-01 are marked
//      paid with ref "pre-ledger (assumed settled)" because every cleaner was
//      squared up through the 10/1 run; later ones stay owed.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const DRY = process.argv.includes("--dry");
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

// date + customer first name → what was actually paid. Ref = how/when it went out.
const KNOWN = [
  { date: "2026-09-13", first: "Jared",     pay: 325, paidAt: "2026-09-16", ref: "Stripe transfer $325 9/16 (Veronica)" },
  { date: "2026-09-16", first: "Katherine", pay: 80,  paidAt: "2026-09-18", ref: "Stripe transfer $80 9/18 (Veronica) — owner to confirm" },
  { date: "2026-09-11", first: "Jody",      pay: 200, paidAt: "2026-09-16", ref: "part of $300 Luz transfer 9/16 — split with Melissa 9/14 estimated", estimate: true },
  { date: "2026-09-14", first: "Melissa",   pay: 100, paidAt: "2026-09-16", ref: "part of $300 Luz transfer 9/16 — split with Jody 9/11 estimated", estimate: true },
  { date: "2026-09-17", first: "Jody",      pay: 200, paidAt: "2026-09-18", ref: "Stripe transfer $200 9/18" },
  { date: "2026-09-18", first: "Rebecca",   pay: 75,  paidAt: "2026-09-24", ref: "Stripe transfer $255 9/24" },
  { date: "2026-09-21", first: "Jody",      pay: 75,  paidAt: "2026-09-24", ref: "Stripe transfer $255 9/24" },
  { date: "2026-09-23", first: "Jody",      pay: 100, paidAt: "2026-09-24", ref: "Stripe transfer $255 9/24" },
  { date: "2026-09-27", first: "Jared",     pay: 130, paidAt: "2026-10-01", ref: "Stripe transfer $415 10/1 (Erika)" },
  { date: "2026-09-28", first: "Neeraj",    pay: 200, paidAt: "2026-10-01", ref: "Stripe transfer $415 10/1 (Erika)" },
  { date: "2026-10-01", first: "Skye",      pay: 85,  paidAt: "2026-10-01", ref: "Stripe transfer $415 10/1 (Erika)" },
  { date: "2026-09-28", first: "Nate",      pay: 140, paidAt: "2026-10-01", ref: "Stripe transfer $345 10/1 (Veronica)" },
  { date: "2026-09-28", first: "Eli",       pay: 105, paidAt: "2026-10-01", ref: "Stripe transfer $345 10/1 (Veronica)" },
  { date: "2026-10-01", first: "Maya",      pay: 100, paidAt: "2026-10-01", ref: "Stripe transfer $345 10/1 (Veronica)" },
  { date: "2026-10-02", first: "Juan",      pay: 85,  paidAt: "2026-10-05", ref: "Stripe transfer $85 10/5 (Veronica)" },
];
const SETTLED_THROUGH = "2026-10-01";

// ── Pay table (mirror of src/lib/cleaner-pay.ts, kept in sync by hand) ──
const round5 = (n) => Math.round(n / 5) * 5;
function classify(b) {
  const s = String(b.service_summary ?? "").toLowerCase();
  const ex = (Array.isArray(b.selected_extras) ? b.selected_extras : []).map((x) => String(x?.label ?? "").toLowerCase());
  if (s.includes("re-clean") || s.includes("reclean") || String(b.coupon_code ?? "").toUpperCase() === "RECLEAN") return "reclean";
  if (s.includes("tidy")) return "tidy";
  if (s.includes("move") || ex.some((l) => l.includes("move"))) return "move";
  if (s.includes("deep") || ex.some((l) => l.includes("deep"))) return "deep";
  return "standard";
}
function tablePay(b, { isRegular, twoCleaners }) {
  const kind = classify(b);
  const br = Math.max(1, Number(b.bedrooms ?? 1) || 1);
  const notes = [];
  let amount;
  if (kind === "reclean") { amount = twoCleaners ? 85 : 130; notes.push(twoCleaners ? "Re-clean, two cleaners" : "Re-clean, solo"); }
  else if (kind === "tidy") { amount = 75; notes.push("Tidy up"); }
  else {
    const std = { 1: 100, 2: 115, 3: 145 }, deep = { 1: 125, 2: 150, 3: 185 };
    const isDeep = kind === "deep" || kind === "move";
    const row = isDeep ? deep : std;
    amount = br <= 3 ? row[br] : row[3] + (br - 3) * (isDeep ? 35 : 30);
    notes.push(`${br}BR ${isDeep ? "deep" : "standard"}`);
    if (kind === "move") { amount += 20; notes.push("+$20 move-in/out"); }
    const recurring = String(b.frequency ?? "").toLowerCase().replace(/[^a-z]/g, "") !== "onetime";
    if (!isDeep && recurring && isRegular) { amount = br === 1 ? 85 : round5(amount * 0.85); notes.push("recurring, regular cleaner"); }
    for (const x of Array.isArray(b.selected_extras) ? b.selected_extras : []) {
      const l = String(x?.label ?? "").toLowerCase(); const p = Number(x?.price ?? 0) || 0;
      if (!l || l.includes("deep") || l.includes("move") || p <= 0) continue;
      const bump = Math.max(5, round5(p / 2)); amount += bump; notes.push(`+$${bump} ${x.label}`);
    }
  }
  return { amount, note: notes.join(", ") };
}

// ── Load ────────────────────────────────────────────────────────────────
const { data: cleaners } = await sb.from("cleaners").select("id, first_name");
const cname = (id) => cleaners.find((c) => c.id === id)?.first_name ?? "?";
const { data: rows, error } = await sb
  .from("bookings")
  .select("*, customers(first_name, last_name)")
  .gte("service_date", "2026-08-01")
  .eq("status", "completed")
  .order("service_date");
if (error) { console.error(error.message); process.exit(1); }
if (rows.length && !("cleaner_pay" in rows[0])) { console.error("Pay columns missing — run lib/supabase/migrations/2026-10-08-cleaner-pay.sql first."); process.exit(1); }
console.log(`${rows.length} completed bookings since 8/1${DRY ? " (DRY RUN)" : ""}\n`);

// ── Pay ─────────────────────────────────────────────────────────────────
let payWrites = 0;
for (const b of rows) {
  if (b.cleaner_pay != null) continue;
  if (!b.assigned_cleaner_id) { console.log(`  skip ${b.service_date} ${b.customers?.first_name}: no cleaner`); continue; }
  const first = String(b.customers?.first_name ?? "").trim().split(/\s+/)[0]?.toLowerCase();
  const known = KNOWN.find((k) => k.date === b.service_date && k.first.toLowerCase() === first);
  let update;
  if (known) {
    update = {
      cleaner_pay: known.pay, cleaner_pay_source: known.estimate ? "estimate" : "manual",
      cleaner_pay_note: known.estimate ? known.ref : "from Quo texts / 10-01 payout run",
      cleaner_paid_at: `${known.paidAt}T17:00:00-04:00`, cleaner_payout_ref: known.ref,
    };
  } else {
    // Regular cleaner = had completed a job for this customer before this one.
    const isRegular = rows.some((o) => o.id !== b.id && o.customer_id === b.customer_id && o.service_date < b.service_date && (o.assigned_cleaner_id === b.assigned_cleaner_id || o.second_cleaner_id === b.assigned_cleaner_id));
    const t = tablePay(b, { isRegular, twoCleaners: !!b.second_cleaner_id });
    const settled = b.service_date <= SETTLED_THROUGH;
    update = {
      cleaner_pay: t.amount, cleaner_pay_source: "estimate", cleaner_pay_note: `table estimate: ${t.note}`,
      ...(settled ? { cleaner_paid_at: `${SETTLED_THROUGH}T17:00:00-04:00`, cleaner_payout_ref: "pre-ledger (assumed settled by the 10/1 run)" } : {}),
    };
    if (b.second_cleaner_id) {
      const t2 = tablePay(b, { isRegular: false, twoCleaners: true });
      update.second_cleaner_pay = classify(b) === "reclean" ? 85 : t2.amount;
      if (settled) { update.second_cleaner_paid_at = update.cleaner_paid_at; update.second_cleaner_payout_ref = update.cleaner_payout_ref; }
    }
  }
  console.log(`  pay  ${b.service_date} ${(b.customers?.first_name ?? "?").padEnd(10)} ${cname(b.assigned_cleaner_id).padEnd(9)} $${String(update.cleaner_pay).padEnd(4)} ${update.cleaner_pay_source.padEnd(8)} ${update.cleaner_paid_at ? "paid " + update.cleaner_paid_at.slice(0, 10) : "OWED"}  ${update.cleaner_pay_note}`);
  if (!DRY) { const { error: e } = await sb.from("bookings").update(update).eq("id", b.id); if (e) console.error("   !! " + e.message); else payWrites++; }
}

// ── Collected + fees ────────────────────────────────────────────────────
async function forPayment(id) {
  try {
    let charge = null;
    if (id.startsWith("pi_")) { const pi = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge.balance_transaction"] }); if (pi.status !== "succeeded") return null; charge = pi.latest_charge; }
    else if (id.startsWith("ch_")) charge = await stripe.charges.retrieve(id, { expand: ["balance_transaction"] });
    if (!charge || charge.status !== "succeeded") return null;
    return { collected_cents: charge.amount_captured ?? charge.amount, stripe_fee_cents: charge.balance_transaction?.fee ?? 0, collected_at: new Date(charge.created * 1000).toISOString(), collected_ref: charge.payment_intent ? String(charge.payment_intent) : charge.id };
  } catch (e) { console.error("   stripe:", id, e.message); return null; }
}
async function forInvoice(bookingId) {
  try {
    const found = await stripe.invoices.search({ query: `metadata["supabase_booking_id"]:"${bookingId}" AND status:"paid"`, limit: 1 });
    const inv = found.data[0]; if (!inv) return null;
    let fee = 0, ref = inv.id;
    const full = await stripe.invoices.retrieve(inv.id, { expand: ["payments.data.payment.payment_intent"] });
    const pi = full.payments?.data?.[0]?.payment?.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (piId) { const c = await forPayment(piId); if (c) { fee = c.stripe_fee_cents; ref = `${inv.id} / ${c.collected_ref}`; } }
    return { collected_cents: inv.amount_paid, stripe_fee_cents: fee, collected_at: new Date((inv.status_transitions?.paid_at ?? inv.created) * 1000).toISOString(), collected_ref: ref };
  } catch (e) { console.error("   stripe invoice:", bookingId.slice(0, 8), e.message); return null; }
}
let collectWrites = 0;
console.log("");
for (const b of rows) {
  if (b.collected_cents != null) continue;
  let c = b.stripe_charge_id ? await forPayment(b.stripe_charge_id) : null;
  if (!c) c = await forInvoice(b.id);
  if (!c && Number(b.pricing_total ?? 0) === 0) c = { collected_cents: 0, stripe_fee_cents: 0, collected_at: b.completed_at ?? new Date().toISOString(), collected_ref: "no charge ($0 job)" };
  if (!c) { console.log(`  $$   ${b.service_date} ${(b.customers?.first_name ?? "?").padEnd(10)} ticket $${b.pricing_total} — nothing collected on Stripe (unpaid invoice / cash / Zelle?)`); continue; }
  console.log(`  $$   ${b.service_date} ${(b.customers?.first_name ?? "?").padEnd(10)} ticket $${String(b.pricing_total).padEnd(4)} collected $${(c.collected_cents / 100).toFixed(2).padEnd(7)} fee $${(c.stripe_fee_cents / 100).toFixed(2).padEnd(5)} ${c.collected_ref}`);
  if (!DRY) { const { error: e } = await sb.from("bookings").update(c).eq("id", b.id); if (e) console.error("   !! " + e.message); else collectWrites++; }
}
console.log(`\n${DRY ? "Would write" : "Wrote"}: pay on ${DRY ? "the rows above" : payWrites + " bookings"}, collections on ${DRY ? "the rows above" : collectWrites + " bookings"}.`);
