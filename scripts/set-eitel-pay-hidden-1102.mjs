// One-off (2026-11-02): record pay on the five Eitel follow-up visits (74 Grand St, Nov 4-13)
// without putting it on the dispatch text. Owner 11/1: "$85 between both the follow-up cleans";
// owner 11/2: he only wanted the number off Erika's text because the two visits are combined,
// it should still show in Accounting. So: cleaner_pay set ($43/$42 alternating = $85 per pair,
// whole dollars only), cleaner_pay_source "manual", cleaner_pay_hidden true. Needs
// lib/supabase/migrations/2026-11-02-cleaner-pay-hidden.sql. Dry run by default; --apply writes.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const apply = process.argv.includes("--apply");
const CUST = "30f6741a-b401-408b-9100-0c90b684f716";
const NOTE = "Owner 11/2: $85 per pair of follow-up visits, combined with Erika's other work; recorded here, kept off the job text";

const probe = await sb.from("bookings").select("id, cleaner_pay_hidden").limit(1);
if (probe.error) {
  console.error("bookings.cleaner_pay_hidden is missing — paste lib/supabase/migrations/2026-11-02-cleaner-pay-hidden.sql in the Supabase SQL editor first.");
  console.error(probe.error.message);
  process.exit(1);
}

const { data: rows, error } = await sb
  .from("bookings")
  .select("id, service_date, status, pricing_total, cleaner_pay, cleaner_pay_source, cleaner_pay_hidden, cleaner_paid_at, assigned_cleaner_id, dispatch_sms_sent_at")
  .eq("customer_id", CUST)
  .neq("status", "cancelled")
  .gt("service_date", "2026-11-02")
  .order("service_date");
if (error) throw new Error(error.message);

let i = 0;
for (const b of rows) {
  const amount = i % 2 === 0 ? 43 : 42;
  i++;
  const skip = b.cleaner_paid_at ? "already paid out" : null;
  console.log(
    b.service_date, b.status, "$" + b.pricing_total,
    "pay", b.cleaner_pay ?? "(none)", b.cleaner_pay_source ?? "", b.cleaner_pay_hidden ? "hidden" : "",
    b.assigned_cleaner_id ? "assigned" : "unassigned", b.dispatch_sms_sent_at ? "texted" : "",
    "->", skip ?? `$${amount} hidden`,
  );
  if (skip || !apply) continue;
  const { error: upErr } = await sb
    .from("bookings")
    .update({ cleaner_pay: amount, cleaner_pay_source: "manual", cleaner_pay_hidden: true, cleaner_pay_note: NOTE })
    .eq("id", b.id);
  if (upErr) throw new Error(upErr.message);
}
console.log(apply ? "Applied." : "Dry run — add --apply to write.");
