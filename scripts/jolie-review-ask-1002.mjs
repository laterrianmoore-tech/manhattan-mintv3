// One-off (2026-10-02): short Google-review ask texted to Jolie B. after the owner's call.
// Uses her booking's tracked review link (clicks land in review_link_clicked_at). Prod URL hardcoded on purpose.
//   node scripts/jolie-review-ask-1002.mjs --send
import { readFileSync } from "node:fs";
const SEND = process.argv.includes("--send");
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const TO = "+15166505351";
const LINK = "https://manhattanmintnyc.com/api/r/02343c21518d354604ec133c063996ff/";
const body = `Hi Jolie, so nice talking with you today! If you have 30 seconds, a quick Google review would mean the world to our small team: ${LINK} Thank you! — Manhattan Mint`;
console.log(body, "\n", body.length, "chars");
if (!SEND) { console.log("dry run — add --send"); process.exit(0); }
const r = await fetch("https://api.openphone.com/v1/messages", { method: "POST", headers: { Authorization: env.OPENPHONE_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ from: env.OPENPHONE_FROM_NUMBER, to: [TO], content: body }) });
const j = await r.json();
console.log(r.status, j?.data?.status ?? JSON.stringify(j).slice(0, 300));
