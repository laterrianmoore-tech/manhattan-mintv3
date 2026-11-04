// Read-only (2026-11-03): texts already sent on Rhema's Nov 4 booking (dispatch to Erika, anything to the 678 number).
import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
for (const to of ["+16787568953", "+14704394805"]) {
  const ph = await fetch(`https://api.openphone.com/v1/messages?phoneNumberId=PNEhpoKFjB&participants[]=${encodeURIComponent(to)}&maxResults=5`, { headers: { Authorization: env.OPENPHONE_API_KEY } }).then(r=>r.json());
  console.log("TO ***" + to.slice(-4), (ph.data??[]).length, "msgs");
  for (const m of (ph.data??[]).reverse()) console.log("  ", m.createdAt.slice(0,16), m.direction.padEnd(8), (m.text||"").replace(/https:\/\/\S+/g,"<link>").slice(0,300));
}
