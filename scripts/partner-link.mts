// Print a broker partner's two links (local or prod).
//   npx tsx scripts/partner-link.mts OSUR [siteUrl]
// The client link is what the broker hands out; the tracking page is private
// (signed with CRON_SECRET, so run this with the production .env.local values
// to get the link that works on the live site).
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const { partnerUrl } = await import("../src/lib/manage-token");
const code = (process.argv[2] || "OSUR").toUpperCase();
const site = process.argv[3] || "https://manhattanmintnyc.com";
console.log(`Client link:   ${site}/quote/?code=${code}`);
console.log(`Tracking page: ${partnerUrl(code, site)}`);
