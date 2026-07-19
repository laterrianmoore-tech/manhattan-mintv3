import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  renderCampaignEmail,
  unsubscribeUrl,
} from "@/lib/email/campaign-template";
import {
  PROSPECT_TRACK,
  CUSTOMER_TRACK,
  type CampaignEmail,
} from "@/lib/email/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Safety valve — a weekly run should never need more than this.
const MAX_SENDS_PER_RUN = 500;
const BATCH_SIZE = 10;

type Recipient = { email: string; segment: "prospect" | "customer"; campaign: CampaignEmail };

// Called weekly by netlify/functions/weekly-campaign.mjs.
// Each recipient gets the next email in their track they haven't
// received yet (campaign_sends is the memory). Recipients who have
// finished their track are skipped. ?dryRun=1 reports the plan
// without sending anything.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const dryRun = url.searchParams.get("dryRun") === "1";
  // ?test=<email> sends that one recipient their next campaign email
  // without logging it — for previewing. Everyone else is skipped.
  const testEmail = url.searchParams.get("test")?.trim().toLowerCase() || null;

  const [subsRes, customersRes, bookingsRes, unsubsRes, sendsRes] = await Promise.all([
    supabaseAdmin.from("email_subscribers").select("email"),
    supabaseAdmin.from("customers").select("id, email"),
    supabaseAdmin
      .from("bookings")
      .select("customer_id")
      .in("status", ["confirmed", "in_progress", "completed"]),
    supabaseAdmin.from("email_unsubscribes").select("email"),
    supabaseAdmin.from("campaign_sends").select("email, campaign_key"),
  ]);

  for (const [label, res] of Object.entries({ subsRes, customersRes, bookingsRes, unsubsRes, sendsRes })) {
    if (res.error) {
      console.error(`[campaigns] ${label} fetch failed:`, res.error);
      return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
    }
  }

  const norm = (e: string) => e.trim().toLowerCase();

  // A "customer" is someone with at least one real booking (confirmed,
  // in progress, or completed). A customers-table row alone isn't enough —
  // abandoned/cancelled bookings leave rows behind. Everyone else who
  // gave us an email is a prospect.
  const realCustomerIds = new Set((bookingsRes.data ?? []).map((b) => b.customer_id));
  const customerEmails = new Set(
    (customersRes.data ?? [])
      .filter((c) => realCustomerIds.has(c.id))
      .map((c) => norm(c.email)),
  );
  const prospectFromCustomersTable = (customersRes.data ?? [])
    .filter((c) => !realCustomerIds.has(c.id))
    .map((c) => norm(c.email));
  const unsubscribed = new Set((unsubsRes.data ?? []).map((u) => norm(u.email)));

  const received = new Map<string, Set<string>>();
  for (const s of sendsRes.data ?? []) {
    const e = norm(s.email);
    if (!received.has(e)) received.set(e, new Set());
    received.get(e)!.add(s.campaign_key);
  }

  const nextInTrack = (email: string, track: CampaignEmail[]) =>
    track.find((c) => !received.get(email)?.has(c.key));

  const recipients: Recipient[] = [];
  const finished: string[] = [];

  // Customers get the customer track — even if they also subscribed.
  for (const email of customerEmails) {
    if (unsubscribed.has(email)) continue;
    const campaign = nextInTrack(email, CUSTOMER_TRACK);
    if (campaign) recipients.push({ email, segment: "customer", campaign });
    else finished.push(email);
  }

  // Subscribers and never-completed-a-booking customers-table rows
  // get the prospect track.
  const prospectEmails = new Set<string>([
    ...(subsRes.data ?? []).map((r) => norm(r.email)),
    ...prospectFromCustomersTable,
  ]);
  for (const email of prospectEmails) {
    if (customerEmails.has(email) || unsubscribed.has(email)) continue;
    const campaign = nextInTrack(email, PROSPECT_TRACK);
    if (campaign) recipients.push({ email, segment: "prospect", campaign });
    else finished.push(email);
  }

  let plan = recipients.slice(0, MAX_SENDS_PER_RUN);
  if (testEmail) {
    plan = recipients.filter((r) => r.email === testEmail);
    if (!plan.length) {
      return NextResponse.json(
        { ok: false, error: `${testEmail} is not in any segment (or has finished their track)` },
        { status: 404 },
      );
    }
  }
  const summary = {
    ok: true,
    dryRun,
    planned: plan.length,
    skippedFinishedTrack: finished.length,
    truncatedBySafetyCap: recipients.length - plan.length,
    bySegment: {
      prospect: plan.filter((r) => r.segment === "prospect").length,
      customer: plan.filter((r) => r.segment === "customer").length,
    },
  };

  if (dryRun) {
    return NextResponse.json({
      ...summary,
      preview: plan.slice(0, 20).map((r) => ({
        email: r.email,
        segment: r.segment,
        campaign: r.campaign.key,
        subject: r.campaign.subject,
      })),
    });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  const siteUrl = process.env.SITE_URL || "https://manhattanmintnyc.com";
  const from = {
    email: process.env.SENDGRID_FROM_EMAIL!,
    name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint",
  };

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < plan.length; i += BATCH_SIZE) {
    const batch = plan.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const unsub = unsubscribeUrl(r.email, siteUrl);
        await sgMail.send({
          to: r.email,
          from,
          subject: r.campaign.subject,
          html: renderCampaignEmail({
            preheader: r.campaign.preheader,
            bodyHtml: r.campaign.body(siteUrl),
            unsubscribeUrl: unsub,
            siteUrl,
          }),
          headers: {
            "List-Unsubscribe": `<${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        if (!testEmail) {
          const { error } = await supabaseAdmin.from("campaign_sends").insert({
            email: r.email,
            campaign_key: r.campaign.key,
            segment: r.segment,
          });
          if (error) console.error(`[campaigns] send log failed for ${r.email}:`, error);
        }
      }),
    );
    for (const [j, res] of results.entries()) {
      if (res.status === "fulfilled") sent++;
      else {
        failed++;
        console.error(`[campaigns] send failed for ${batch[j].email}:`, res.reason);
      }
    }
  }

  console.log(`[campaigns] run complete — sent ${sent}, failed ${failed}`);
  return NextResponse.json({ ...summary, sent, failed });
}
