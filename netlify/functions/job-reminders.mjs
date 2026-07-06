// Daily cleaner reminders — fires at 21:00 UTC (5pm ET summer / 4pm ET winter)
// and asks the site to text every dispatched cleaner about tomorrow's jobs.
export default async () => {
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const res = await fetch(`${siteUrl}/api/reminders/`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  });
  const body = await res.text();
  console.log("[job-reminders]", res.status, body);
};

export const config = {
  schedule: "0 21 * * *",
};
