// Prints the Monday recurring-conversion text without sending it.
//   npx tsx scripts/recurring-report-dryrun.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const { buildRecurringReport, formatRecurringReportSms } = await import("../src/lib/recurring-report");
const r = await buildRecurringReport();
console.log(JSON.stringify(r, null, 1));
console.log("\n--- SMS ---\n" + formatRecurringReportSms(r));
