// Broker referral tracking (2026-10-30): check the fee math and, against the
// real database, print what a partner's page and the Thursday text would show.
//   npx tsx scripts/broker-stats-dryrun.mts            # pure fee-math checks, no database
//   npx tsx scripts/broker-stats-dryrun.mts OSUR       # live stats + owed list for that code
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const b = await import("../src/lib/brokers");

const osur = b.SEED_PARTNERS[0];
const row = (o: Partial<b.BrokerJobRow> & { id: string; customer_id: string; service_date: string; status: string }): b.BrokerJobRow => ({
  frequency: "One-Time", bedrooms: 2, bathrooms: 1, service_summary: null, collected_cents: null, pricing_total: 200, completed_at: null,
  broker_code: null, broker_fee_paid_at: null, broker_fee_ref: null, customers: { first_name: "Jane", last_name: "Doe" }, ...o,
});

// 1. Nothing attributed yet.
let s = b.computeBrokerStats(osur, [], 7);
assert.deepEqual([s.clicks, s.bookings, s.completed, s.feesEarned, s.feesOwed], [7, 0, 0, 0, 0]);

// 2. One booked (no fee yet), one completed but not collected (no fee yet), one completed+paid one-time ($40).
s = b.computeBrokerStats(osur, [
  row({ id: "a", customer_id: "c1", service_date: "2026-11-03", status: "confirmed" }),
  row({ id: "b", customer_id: "c2", service_date: "2026-11-01", status: "completed" }),
  row({ id: "c", customer_id: "c3", service_date: "2026-10-30", status: "completed", collected_cents: 20000 }),
  row({ id: "x", customer_id: "c4", service_date: "2026-10-29", status: "cancelled", collected_cents: 20000 }),
], 3);
assert.deepEqual([s.bookings, s.completed, s.recurringConversions, s.feesEarned, s.feesPaid, s.feesOwed], [3, 2, 0, 40, 0, 40]);
assert.equal(s.jobs.find((j) => j.bookingId === "b")!.status, "awaiting_payment");
assert.equal(s.jobs[0].bookingId, "a", "newest first");

// 3. Recurring client: first completed paid bi-weekly visit = $40 + $75, second = nothing (both fees are once per client); a $0 free clean earns nothing; a paid stamp moves money to "paid".
s = b.computeBrokerStats(osur, [
  row({ id: "r1", customer_id: "c5", service_date: "2026-11-02", status: "completed", frequency: "Bi-Weekly", collected_cents: 17000, broker_fee_paid_at: "2026-11-06T14:00:00Z", broker_fee_ref: "Zelle 11/6" }),
  row({ id: "r2", customer_id: "c5", service_date: "2026-11-16", status: "completed", frequency: "Bi-Weekly", collected_cents: 17000 }),
  row({ id: "r3", customer_id: "c5", service_date: "2026-11-30", status: "confirmed", frequency: "Bi-Weekly" }),
  row({ id: "f", customer_id: "c6", service_date: "2026-11-05", status: "completed", collected_cents: 0, pricing_total: 0 }),
  row({ id: "l", customer_id: "c7", service_date: "2026-11-06", status: "lockout", collected_cents: 11900 }),
], 0);
const r1 = s.jobs.find((j) => j.bookingId === "r1")!, r2 = s.jobs.find((j) => j.bookingId === "r2")!;
assert.deepEqual([r1.fee, r1.firstClean, r1.recurringBonus, r2.fee, r2.firstClean, r2.recurringBonus], [115, true, true, 0, false, false]);
assert.deepEqual([s.newClients, s.recurringConversions, s.feesEarned, s.feesPaid, s.feesOwed, s.completed], [1, 1, 115, 115, 0, 3]);

assert.equal(s.jobs.find((j) => j.bookingId === "l")!.fee, 0, "lockout earns nothing");
assert.equal(s.jobs.find((j) => j.bookingId === "f")!.fee, 0, "$0 clean earns nothing");

// 3b. One-time client who later goes weekly: $40 on the first clean, $75 on the later weekly visit, nothing on the third. Monthly never earns the bonus.
s = b.computeBrokerStats(osur, [
  row({ id: "o1", customer_id: "c8", service_date: "2026-11-01", status: "completed", collected_cents: 20000 }),
  row({ id: "o2", customer_id: "c8", service_date: "2026-11-15", status: "completed", frequency: "Weekly", collected_cents: 17000 }),
  row({ id: "o3", customer_id: "c8", service_date: "2026-12-15", status: "completed", frequency: "Weekly", collected_cents: 17000 }),
  row({ id: "m1", customer_id: "c9", service_date: "2026-11-02", status: "completed", frequency: "Monthly", collected_cents: 20000 }),
  row({ id: "m2", customer_id: "c9", service_date: "2026-12-02", status: "completed", frequency: "Monthly", collected_cents: 20000 }),
], 0);
assert.deepEqual(s.jobs.map((j) => [j.bookingId, j.fee]).sort(), [["m1", 40], ["m2", 0], ["o1", 40], ["o2", 75], ["o3", 0]]);
assert.deepEqual([s.newClients, s.recurringConversions, s.feesEarned], [2, 1, 155]);
assert.ok(b.earnsRecurringBonus("Weekly") && b.earnsRecurringBonus("Bi-Weekly") && !b.earnsRecurringBonus("Monthly") && !b.earnsRecurringBonus("One-Time"));

// 4. Code shape.
assert.ok(b.looksLikeBrokerCode("osur") && b.looksLikeBrokerCode("OSUR"));
assert.ok(!b.looksLikeBrokerCode("MINT39FDA5") && !b.looksLikeBrokerCode("FREE39FDA5") && !b.looksLikeBrokerCode("12") && !b.looksLikeBrokerCode(""));
console.log("fee-math checks passed");

const code = process.argv[2];
if (code) {
  const partner = await b.getBrokerPartner(code);
  if (!partner) throw new Error(`no partner ${code}`);
  const stats = await b.brokerStatsFor(partner);
  console.log(JSON.stringify({ ...stats, partner: partner.code }, null, 1));
  const owed = await b.brokerFeesOwed();
  console.log("owed:", JSON.stringify(owed, null, 1));
}
