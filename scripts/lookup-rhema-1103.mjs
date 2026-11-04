import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const { data: cs } = await sb.from("customers").select("id,first_name,last_name,phone,email").or("first_name.ilike.%rhema%,last_name.ilike.%rhema%");
console.log("CUSTOMERS", JSON.stringify(cs, null, 1));
for (const c of cs ?? []) {
  const { data: bks } = await sb.from("bookings").select("*").eq("customer_id", c.id).order("service_date", { ascending: false }).limit(3);
  for (const b of bks ?? []) console.log("BOOKING", JSON.stringify(b, null, 1));
}
