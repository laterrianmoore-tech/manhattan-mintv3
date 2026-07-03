// One-off cleanup: mark duplicate pending bookings as cancelled.
// A duplicate = same customer + same service_date as an earlier booking.
// Keeps the EARLIEST booking in each group (or the dispatched/confirmed one if any);
// marks the rest status=cancelled. Never touches completed or already-cancelled rows,
// and never deletes anything.
// Run: node scripts/cleanup-duplicate-bookings.mjs           (dry run — prints plan)
//      node scripts/cleanup-duplicate-bookings.mjs --apply   (actually updates)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const initials = (a, b) => `${(a || "?")[0] || "?"}.${(b || "?")[0] || "?"}.`;

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: bookings, error } = await supabase
  .from("bookings")
  .select(
    "id, created_at, status, service_date, customer_id, assigned_cleaner_id, customers(first_name, last_name)"
  )
  .order("created_at", { ascending: true });
if (error) {
  console.error("fetch error:", error.message);
  process.exit(1);
}

// Group by customer + service date
const groups = new Map();
for (const b of bookings || []) {
  const key = `${b.customer_id}|${b.service_date}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(b);
}

const toCancel = [];
for (const [, group] of groups) {
  if (group.length < 2) continue;
  // Keeper preference: a dispatched/confirmed/in_progress/completed row, else the earliest
  const keeper =
    group.find((b) => ["confirmed", "in_progress", "completed"].includes(b.status)) || group[0];
  for (const b of group) {
    if (b.id === keeper.id) continue;
    if (b.status !== "pending") continue; // only cancel pending dupes
    toCancel.push({ ...b, keeperId: keeper.id });
  }
}

if (!toCancel.length) {
  console.log("No duplicate pending bookings found. Nothing to do.");
  process.exit(0);
}

console.log(`${APPLY ? "CANCELLING" : "DRY RUN — would cancel"} ${toCancel.length} duplicate(s):`);
for (const b of toCancel) {
  const c = b.customers;
  console.log(
    `  ${initials(c?.first_name, c?.last_name)} | svc ${b.service_date} | created ${b.created_at} | ${b.id} (keeping ${b.keeperId})`
  );
}

if (APPLY) {
  const { error: updErr } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .in(
      "id",
      toCancel.map((b) => b.id)
    );
  if (updErr) {
    console.error("update error:", updErr.message);
    process.exit(1);
  }
  console.log("Done — duplicates marked cancelled (rows kept, nothing deleted).");
} else {
  console.log("\nRe-run with --apply to make these changes.");
}
