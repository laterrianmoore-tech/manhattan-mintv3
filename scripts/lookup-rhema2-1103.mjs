import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
const { data: c } = await sb.from("customers").select("*").eq("id", "919e175f-85a1-404f-a31e-0c95c8ee3a94").single();
console.log("CUSTOMER", JSON.stringify(c, null, 1));
const { data: cl } = await sb.from("cleaners").select("first_name,last_name,status").eq("id", "55d2f7b9-5a5e-475c-b476-2a7006d4e13f").single();
console.log("CLEANER", JSON.stringify(cl));
