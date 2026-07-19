// Weekly marketing campaign — fires Tuesdays at 14:00 UTC
// (10am ET summer / 9am ET winter) and asks the site to send the
// next campaign email to every prospect and customer.
export default async () => {
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const res = await fetch(`${siteUrl}/api/campaigns/send/`, {
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  });
  const body = await res.text();
  console.log("[weekly-campaign]", res.status, body);
};

export const config = {
  schedule: "0 14 * * 2",
};
