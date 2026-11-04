// One-off (2026-11-03): Rhema Onyia's Nov 4 deep clean (booking b3884b78) was booked by Chike Onyia, who emailed and
// texted from 470-439-4805 but put the sister's 678 number on the form. Owner's call: Chike's number becomes the main
// contact (every text), and the sister stays on the "on the way" text via bookings.notify_phones.
// Re-runnable. The notify_phones write needs lib/supabase/migrations/2026-11-03-notify-phones.sql pasted first;
// until then this script sets the main phone and says so.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const CUSTOMER = "919e175f-85a1-404f-a31e-0c95c8ee3a94";
const BOOKING = "b3884b78-2238-4a6d-b907-3c42d17e3080";
const CHIKE = "4704394805";
const SISTER = "6787568953";
const mask = (p) => "***" + String(p ?? "").slice(-4);

const { data: c, error: e1 } = await sb.from("customers").update({ phone: CHIKE }).eq("id", CUSTOMER).select("first_name,phone").single();
if (e1) throw new Error("customer: " + e1.message);
console.log("MAIN CONTACT", c.first_name, mask(c.phone));

const { data: b, error: e2 } = await sb.from("bookings").update({ notify_phones: [SISTER] }).eq("id", BOOKING).select("id,service_date,notify_phones").single();
if (e2) {
  console.log("NOTIFY_PHONES NOT SET: " + e2.message);
  console.log("Paste lib/supabase/migrations/2026-11-03-notify-phones.sql into the Supabase SQL editor, then rerun this script.");
  process.exit(2);
}
console.log("ON-THE-WAY EXTRAS", b.id.slice(0, 8), b.service_date, b.notify_phones.map(mask).join(", "));
