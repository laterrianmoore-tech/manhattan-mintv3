// Cleaner onboarding packet (2026-11-03).
//
// One send per applicant, triggered automatically when the /onboarding form
// is submitted (and on demand from /admin/onboarding or
// scripts/send-onboarding-packet.mts). It does the three things the owner
// used to do by hand after a phone screen:
//
//   1. Stripe Connect — creates the Express account if the cleaner doesn't
//      have one and mints the durable /api/connect/onboard link.
//   2. Certn — creates the background-check invite through the Certn API
//      when CERTN_API_KEY is set. Without a key the applicant is told the
//      Certn email comes separately and the owner is told to send it from
//      the Certn dashboard.
//   3. Independent Contractor Agreement — a signed /sign link where the
//      applicant reads and e-signs the vF agreement; the signed PDF is
//      emailed to both sides (see app/api/sign).
//
// Everything goes out in one email and one text, and
// cleaners.onboarding_packet_sent_at is stamped.

import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendSms } from "@/lib/openphone";
import { connectOnboardUrl, signUrl } from "@/lib/manage-token";
import { publicSiteUrl } from "@/lib/referral";
import type { Database } from "@/lib/supabase/types";

type CleanerRow = Database["public"]["Tables"]["cleaners"]["Row"];

const PHONE_DISPLAY = "(914) 863-7902";
const SIGNATURE = "Manhattan Mint Luxury Cleaning";

export function siteUrl(): string {
  return publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
}
function ownerPhones(): string[] {
  return (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
}
function ownerEmails(): string[] {
  return (process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL || "hello@manhattanmintnyc.com")
    .split(",").map((e) => e.trim()).filter(Boolean);
}
function fromAddress() {
  return { email: process.env.SENDGRID_FROM_EMAIL || "hello@manhattanmintnyc.com", name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" };
}
function looksLikeEmail(e: string | null | undefined): e is string {
  return !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !/placeholder|example\.com|noemail/i.test(e);
}
export function cleanerDisplayName(c: Pick<CleanerRow, "first_name" | "last_name" | "legal_name">): string {
  return (c.legal_name || `${c.first_name} ${c.last_name || ""}`).trim();
}

// ---------------------------------------------------------------------------
// 1. Stripe Connect
// ---------------------------------------------------------------------------
export async function ensureConnectAccount(c: CleanerRow): Promise<{ accountId: string; created: boolean }> {
  if (c.stripe_account_id) return { accountId: c.stripe_account_id, created: false };
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  const stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  const email = looksLikeEmail(c.email) ? c.email : undefined;
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email,
    business_type: "individual",
    capabilities: { transfers: { requested: true } },
    individual: { first_name: c.first_name, last_name: c.last_name || undefined, email },
    business_profile: { mcc: "7349", product_description: "Residential cleaning services for Manhattan Mint NYC LLC clients" },
    metadata: { cleaner_id: c.id, source: "onboarding-packet" },
  });
  const { error } = await supabaseAdmin.from("cleaners").update({ stripe_account_id: account.id }).eq("id", c.id);
  if (error) throw new Error(`Connect account ${account.id} was created but could not be saved on the cleaner: ${error.message}`);
  return { accountId: account.id, created: true };
}

// ---------------------------------------------------------------------------
// 2. Certn
// ---------------------------------------------------------------------------
export type CertnResult = {
  status: "invited" | "already_invited" | "not_configured" | "failed" | "skipped_dry_run";
  applicationId?: string | null;
  error?: string;
};

export function certnConfigured(): boolean {
  return !!process.env.CERTN_API_KEY;
}

export async function inviteCertn(c: CleanerRow): Promise<CertnResult> {
  if (c.certn_report_id) return { status: "already_invited", applicationId: c.certn_report_id };
  const key = process.env.CERTN_API_KEY;
  if (!key) return { status: "not_configured" };
  if (!looksLikeEmail(c.email)) return { status: "failed", error: "cleaner has no real email address" };

  // Certn HR API v1: POST /hr/v1/applications/invite/ with the checks to run
  // as boolean request flags. Which flags an account may use depends on the
  // Certn plan, so they come from env (comma-separated), defaulting to the
  // criminal record check the agreement promises.
  const base = (process.env.CERTN_API_BASE || "https://api.certn.co").replace(/\/$/, "");
  const scheme = process.env.CERTN_AUTH_SCHEME || "Bearer";
  const flags = (process.env.CERTN_REQUEST_FLAGS || "request_criminal_record_check").split(",").map((s) => s.trim()).filter(Boolean);
  const body: Record<string, unknown> = {
    email: c.email,
    tag: "manhattan-mint-cleaner",
    information: { first_name: c.first_name, last_name: c.last_name || "" },
  };
  for (const f of flags) body[f] = true;

  try {
    const res = await fetch(`${base}/hr/v1/applications/invite/`, {
      method: "POST",
      headers: { Authorization: `${scheme} ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { status: "failed", error: `Certn ${res.status}: ${JSON.stringify(json).slice(0, 300)}` };
    const id: string | null = json?.id ?? null;
    const { error } = await supabaseAdmin
      .from("cleaners")
      .update({ certn_report_id: id, certn_invited_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) console.error("[onboarding-packet] certn invite saved to Certn but not to Supabase:", error.message);
    return { status: "invited", applicationId: id };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// 3. The packet itself
// ---------------------------------------------------------------------------
export type PacketResult = {
  cleanerId: string;
  name: string;
  email: string;
  phone: string;
  connectAccountId: string | null;
  connectCreated: boolean;
  connectUrl: string;
  signUrl: string;
  certn: CertnResult;
  dryRun: boolean;
  emailSubject: string;
  emailText: string;
  smsBody: string;
  ownerSms: string;
  emailSent: boolean;
  smsSent: boolean;
  smsError: string | null;
  stamped: boolean;
};

function certnLine(r: CertnResult, email: string): string {
  switch (r.status) {
    case "invited": return `Certn invite sent (application ${r.applicationId ?? "?"}).`;
    case "already_invited": return `Certn already invited earlier (${r.applicationId ?? "?"}).`;
    case "not_configured": return `⚠️ Certn NOT sent — no CERTN_API_KEY. Invite ${email} from the Certn dashboard.`;
    case "skipped_dry_run": return certnConfigured() ? "Certn invite would be sent." : `⚠️ Certn would NOT be sent (no CERTN_API_KEY) — invite ${email} by hand.`;
    case "failed": return `⚠️ Certn invite FAILED (${r.error}). Invite ${email} from the Certn dashboard.`;
  }
}

function buildEmail(first: string, sign: string, connect: string, certn: CertnResult): { subject: string; text: string; html: string } {
  const subject = "Your Manhattan Mint onboarding — 3 quick steps";
  const certnSentence = certn.status === "invited" || certn.status === "already_invited"
    ? "You'll get a separate email from Certn today (check spam too). It takes about five minutes and we cover the cost."
    : "You'll get a separate email from Certn (check spam too). It takes about five minutes and we cover the cost.";
  const insurance = "Before your first job, send us a Certificate of Insurance: general liability with $1,000,000 per occurrence and $2,000,000 aggregate, naming Manhattan Mint NYC LLC as additional insured with a waiver of subrogation. If you work alone, include your NYS CE-200 workers' comp exemption.";

  const text = [
    `Hi ${first},`,
    ``,
    `Welcome to ${SIGNATURE}. Here is everything you need to get set up. The first two steps take about five minutes each.`,
    ``,
    `1) Sign your Independent Contractor Agreement`,
    `   Read and sign online: ${sign}`,
    `   You'll get a signed PDF copy by email.`,
    ``,
    `2) Set up your payouts with Stripe`,
    `   ${connect}`,
    `   Stripe collects your bank details and tax info directly; we never see your bank login. Payouts go out every Friday for the week's completed jobs.`,
    ``,
    `3) Background check with Certn`,
    `   ${certnSentence}`,
    ``,
    insurance,
    ``,
    `Questions? Reply to this email or text ${PHONE_DISPLAY}.`,
    ``,
    SIGNATURE,
  ].join("\n");

  const SANS = "'DM Sans',Helvetica,Arial,sans-serif";
  const step = (n: number, title: string, body: string, cta?: { label: string; href: string }) => `
    <tr><td style="padding:18px 0;border-bottom:1px solid #eeeae1;">
      <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9a9a92;">Step ${n}</p>
      <p style="margin:0 0 8px;font-family:${SANS};font-size:17px;font-weight:700;color:#141414;">${title}</p>
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.55;color:#4a4a44;">${body}</p>
      ${cta ? `<p style="margin:14px 0 0;"><a href="${cta.href}" style="display:inline-block;background:#1e4d38;color:#ffffff;text-decoration:none;font-family:${SANS};font-size:15px;font-weight:700;padding:12px 20px;border-radius:8px;">${cta.label}</a></p>
      <p style="margin:8px 0 0;font-family:${SANS};font-size:12px;color:#9a9a92;word-break:break-all;">${cta.href}</p>` : ""}
    </td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#faf8f4;border-radius:14px;padding:32px 28px;">
    <tr><td>
      <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#1e4d38;">Welcome to Manhattan Mint</p>
      <p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.55;color:#4a4a44;">Hi ${first}, here is everything you need to get set up. The first two steps take about five minutes each.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${step(1, "Sign your Independent Contractor Agreement", "Read it and sign online. You'll get a signed PDF copy by email.", { label: "Read & sign the agreement", href: sign })}
        ${step(2, "Set up your payouts with Stripe", "Stripe collects your bank details and tax info directly; we never see your bank login. Payouts go out every Friday for the week's completed jobs.", { label: "Set up Stripe payouts", href: connect })}
        ${step(3, "Background check with Certn", certnSentence)}
      </table>
      <p style="margin:20px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:#4a4a44;"><strong>Before your first job:</strong> ${insurance.replace(/^Before your first job, /, "")}</p>
      <p style="margin:20px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:#4a4a44;">Questions? Reply to this email or text <a href="sms:+19148637902" style="color:#1e4d38;">${PHONE_DISPLAY}</a>.</p>
      <p style="margin:24px 0 0;font-family:${SANS};font-size:14px;color:#141414;font-weight:700;">${SIGNATURE}</p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-family:${SANS};font-size:11px;color:#9a9a92;">Manhattan Mint NYC LLC · 401 E 34th St, New York, NY 10016</p>
  </td></tr></table></body></html>`;

  return { subject, text, html };
}

export async function sendOnboardingPacket(opts: { cleanerId: string; dryRun?: boolean; notifyOwner?: boolean }): Promise<PacketResult> {
  const dryRun = !!opts.dryRun;
  const { data: c, error } = await supabaseAdmin.from("cleaners").select("*").eq("id", opts.cleanerId).single();
  if (error || !c) throw new Error(`cleaner ${opts.cleanerId} not found${error ? `: ${error.message}` : ""}`);
  const cleaner = c as CleanerRow;
  if (cleaner.status === "inactive") throw new Error(`${cleanerDisplayName(cleaner)} is inactive — not sending an onboarding packet`);
  if (!looksLikeEmail(cleaner.email)) throw new Error(`${cleanerDisplayName(cleaner)} has no real email on file — the packet goes by email, add one first`);

  const site = siteUrl();
  const sign = signUrl(cleaner.id, site);

  // Stripe: a dry run never creates an account.
  let connectAccountId = cleaner.stripe_account_id;
  let connectCreated = false;
  if (!dryRun) {
    const r = await ensureConnectAccount(cleaner);
    connectAccountId = r.accountId;
    connectCreated = r.created;
  }
  const connect = connectAccountId ? connectOnboardUrl(connectAccountId, site) : `${site}/api/connect/onboard/?a=<created on send>`;

  const certn: CertnResult = dryRun
    ? cleaner.certn_report_id ? { status: "already_invited", applicationId: cleaner.certn_report_id } : { status: "skipped_dry_run" }
    : await inviteCertn(cleaner);

  const first = cleaner.first_name;
  const email = buildEmail(first, sign, connect, certn);
  const smsBody = [
    `Hi ${first}, welcome to ${SIGNATURE}! Your onboarding steps just went to ${cleaner.email}. The two quick ones:`,
    `1) Sign your contractor agreement: ${sign}`,
    `2) Set up Stripe payouts: ${connect}`,
    `Questions? Reply here.`,
  ].join("\n");
  const ownerSms = [
    `ONBOARDING PACKET → ${cleanerDisplayName(cleaner)} (${cleaner.phone}).`,
    `Stripe ${connectAccountId ?? "(created on send)"}${connectCreated ? " (new)" : ""}.`,
    certnLine(certn, cleaner.email),
    `Agreement: link sent, unsigned.`,
  ].join(" ");

  const result: PacketResult = {
    cleanerId: cleaner.id, name: cleanerDisplayName(cleaner), email: cleaner.email, phone: cleaner.phone,
    connectAccountId, connectCreated, connectUrl: connect, signUrl: sign, certn, dryRun,
    emailSubject: email.subject, emailText: email.text, smsBody, ownerSms,
    emailSent: false, smsSent: false, smsError: null, stamped: false,
  };
  if (dryRun) return result;

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to: { email: cleaner.email, name: cleanerDisplayName(cleaner) },
    from: fromAddress(),
    bcc: ownerEmails().filter((e) => e.toLowerCase() !== cleaner.email.toLowerCase()),
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  result.emailSent = true;

  if (cleaner.phone) {
    const sms = await sendSms({ to: cleaner.phone, body: smsBody, cleanerId: cleaner.id, recipientType: "cleaner", eventType: "other" });
    result.smsSent = sms.ok;
    result.smsError = sms.ok ? null : (sms.errorMessage ?? "SMS failed");
  }

  const { error: stampErr } = await supabaseAdmin
    .from("cleaners")
    .update({ onboarding_packet_sent_at: new Date().toISOString() })
    .eq("id", cleaner.id);
  if (stampErr) console.error("[onboarding-packet] could not stamp onboarding_packet_sent_at (migration run?):", stampErr.message);
  result.stamped = !stampErr;

  if (opts.notifyOwner !== false) {
    for (const phone of ownerPhones()) {
      await sendSms({ to: phone, body: ownerSms, cleanerId: cleaner.id, recipientType: "cleaner", eventType: "other" }).catch(() => undefined);
    }
  }
  return result;
}
