// Thursday payroll text to the owner — 13:00 UTC (9am ET in summer, 8am ET in
// winter). Asks the site to total what each cleaner is owed and text it.
export default async () => {
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const res = await fetch(`${siteUrl}/api/reports/payroll/`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  });
  const body = await res.text();
  console.log("[thursday-payroll]", res.status, body.slice(0, 500));
};

export const config = {
  schedule: "0 13 * * 4",
};
