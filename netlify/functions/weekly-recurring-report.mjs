// Monday recurring-conversion text to the owner — 13:00 UTC (9am ET in summer,
// 8am ET in winter). Asks the site to compute the numbers and send the text.
export default async () => {
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const res = await fetch(`${siteUrl}/api/reports/recurring/`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  });
  const body = await res.text();
  console.log("[weekly-recurring-report]", res.status, body.slice(0, 500));
};

export const config = {
  schedule: "0 13 * * 1",
};
