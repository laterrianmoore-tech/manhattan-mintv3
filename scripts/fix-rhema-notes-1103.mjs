// One-off (2026-11-03): rewrite the cleaner-visible notes on Rhema Onyia's Nov 4 deep clean (booking b3884b78).
// The booking form pasted the emailed price ("$250 flat plus tax with code MINT250") into cleaning_notes; cleaners must never see
// price or coupon info, so this drops that sentence and adds the deep-clean scope promised in the quote email. Access notes
// (doorman, coordinate with the sister) stay as they are on the customer record.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const ID = "b3884b78-2238-4a6d-b907-3c42d17e3080";
const notes = `One-time clean: standard clean throughout, plus a DEEP CLEAN of the kitchen and both bathrooms (inside the oven, behind and under anything that moves, every surface, grout line and fixture). Two cats in the apartment. Doorman building: the front desk lets you in; coordinate timing with the client's sister (number in Access).`;
const { data, error } = await sb.from("bookings").update({ cleaning_notes: notes }).eq("id", ID).select("id,service_date,preferred_time_ranges,pricing_total,coupon_code,cleaning_notes,customers(access_notes,phone)").single();
if (error) throw new Error(error.message);
console.log("UPDATED", data.id.slice(0, 8), data.service_date, JSON.stringify(data.preferred_time_ranges), "$" + data.pricing_total, data.coupon_code, "\nNOTES: " + data.cleaning_notes, "\nACCESS: " + data.customers.access_notes, "\nPHONE: ***" + String(data.customers.phone).slice(-4));
