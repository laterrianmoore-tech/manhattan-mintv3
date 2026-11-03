// Send (or preview) a cleaner's onboarding packet from the command line (2026-11-03).
//   npx tsx scripts/send-onboarding-packet.mts <email | cleaner id>          # dry run: prints the email + text, creates nothing
//   npx tsx scripts/send-onboarding-packet.mts <email | cleaner id> --apply  # creates the Connect account if needed, invites Certn, sends email + text
// Links are built from SITE_URL and fall back to https://manhattanmintnyc.com when that isn't https — never localhost.
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const who = args.find((a) => !a.startsWith("--"));
if (!who) { console.log("usage: npx tsx scripts/send-onboarding-packet.mts <email | cleaner id> [--apply]"); process.exit(1); }

const { supabaseAdmin } = await import("../src/lib/supabase/server");
const { sendOnboardingPacket } = await import("../src/lib/onboarding-packet");

const q = supabaseAdmin.from("cleaners").select("id, first_name, last_name, email, status");
const { data, error } = /^[0-9a-f-]{36}$/i.test(who) ? await q.eq("id", who) : await q.ilike("email", who);
if (error || !data?.length) { console.log("cleaner not found:", error?.message ?? who); process.exit(1); }
const c = data[0];
console.log(`${c.first_name} ${c.last_name} <${c.email}> status=${c.status} id=${c.id}`);

const r = await sendOnboardingPacket({ cleanerId: c.id, dryRun: !apply });
console.log(`\n--- EMAIL (${r.emailSubject}) ---\n${r.emailText}`);
console.log(`\n--- TEXT to ${r.phone} ---\n${r.smsBody}`);
console.log(`\n--- OWNER TEXT ---\n${r.ownerSms}`);
console.log(`\nconnect=${r.connectAccountId ?? "(created on send)"} certn=${r.certn.status}${r.certn.error ? " " + r.certn.error : ""}`);
console.log(apply ? `SENT: email=${r.emailSent} sms=${r.smsSent}${r.smsError ? " " + r.smsError : ""} stamped=${r.stamped}` : "DRY RUN — nothing created or sent. Rerun with --apply.");
