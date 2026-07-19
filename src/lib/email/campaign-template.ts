import { createHmac, timingSafeEqual } from "crypto";

// ============================================================
// Unsubscribe tokens
// HMAC of the lowercased email, keyed by CRON_SECRET — no DB
// column needed, and the link can't be forged for other emails.
// ============================================================

function secret(): string {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error("CRON_SECRET not set — required for unsubscribe tokens");
  return s;
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function unsubscribeUrl(email: string, siteUrl: string): string {
  const params = new URLSearchParams({
    e: email.trim().toLowerCase(),
    t: unsubscribeToken(email),
  });
  return `${siteUrl}/api/unsubscribe/?${params.toString()}`;
}

// ============================================================
// Brand constants
// ============================================================

const GREEN_DARK = "#1e4d38";
const GREEN = "#2d6a4f";
const GREEN_BRIGHT = "#1d9e75";
const INK = "#141414";
const BODY = "#4a4a44";
const CREAM = "#f4f1ea";
const CARD = "#faf8f4";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'DM Sans',Helvetica,Arial,sans-serif";

const MAILING_ADDRESS = "Manhattan Mint NYC LLC · 401 E 34th St, New York, NY 10016";

// ============================================================
// Building blocks — email-client-safe (tables + inline styles)
// ============================================================

// Eyebrow + serif display headline + optional standfirst.
export function hero(eyebrow: string, title: string, standfirst?: string): string {
  return `
  <p style="margin:0 0 14px;color:${GREEN_BRIGHT};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">${eyebrow}</p>
  <h2 style="margin:0 0 14px;color:${INK};font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;">${title}</h2>
  ${standfirst ? `<p style="margin:0 0 26px;color:${BODY};font-family:${SANS};font-size:16px;line-height:1.65;">${standfirst}</p>` : `<div style="height:12px;"></div>`}`;
}

export function para(text: string): string {
  return `<p style="margin:0 0 18px;color:${BODY};font-family:${SANS};font-size:15px;line-height:1.7;">${text}</p>`;
}

// Numbered editorial card — for tips and step-by-step content.
export function numberedCard(num: number, title: string, text: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
    <td width="44" valign="top" style="padding:18px 0 0 18px;background:${CARD};border-radius:10px 0 0 10px;border-left:3px solid ${GREEN_BRIGHT};">
      <p style="margin:0;color:${GREEN};font-family:${SERIF};font-size:22px;font-style:italic;">${num}</p>
    </td>
    <td valign="top" style="padding:16px 20px 16px 12px;background:${CARD};border-radius:0 10px 10px 0;">
      <p style="margin:0 0 4px;color:${INK};font-family:${SANS};font-size:15px;font-weight:700;">${title}</p>
      <p style="margin:0;color:${BODY};font-family:${SANS};font-size:14px;line-height:1.65;">${text}</p>
    </td>
  </tr></table>`;
}

// Plain feature card (no number) — icons/short rows.
export function featureRow(lead: string, text: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;"><tr>
    <td style="padding:14px 20px;background:${CARD};border-radius:10px;">
      <p style="margin:0;color:${BODY};font-family:${SANS};font-size:14px;line-height:1.6;"><strong style="color:${INK};">${lead}</strong> ${text}</p>
    </td>
  </tr></table>`;
}

// Big centered offer block — for coupon codes.
export function offerBlock(code: string, line1: string, line2: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr>
    <td style="padding:28px 24px;background:${GREEN_DARK};border-radius:12px;text-align:center;">
      <p style="margin:0 0 6px;color:rgba(255,255,255,.65);font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;">${line1}</p>
      <p style="margin:0 0 8px;color:#fff;font-family:${SERIF};font-size:34px;letter-spacing:.08em;">${code}</p>
      <p style="margin:0;color:rgba(255,255,255,.75);font-family:${SANS};font-size:13px;">${line2}</p>
    </td>
  </tr></table>`;
}

// Pull-quote / testimonial-style callout.
export function pullQuote(text: string, attribution?: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;"><tr>
    <td style="padding:4px 0 4px 22px;border-left:3px solid ${GREEN_BRIGHT};">
      <p style="margin:0;color:${INK};font-family:${SERIF};font-size:17px;font-style:italic;line-height:1.6;">${text}</p>
      ${attribution ? `<p style="margin:8px 0 0;color:${BODY};font-family:${SANS};font-size:13px;">— ${attribution}</p>` : ""}
    </td>
  </tr></table>`;
}

// Primary CTA with optional supporting line under it.
export function ctaBlock(href: string, label: string, subtext?: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;"><tr><td align="center">
    <table cellpadding="0" cellspacing="0"><tr><td style="background:${GREEN};border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:16px 42px;color:#fff;font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:.02em;text-decoration:none;">${label}</a>
    </td></tr></table>
    ${subtext ? `<p style="margin:12px 0 0;color:#9a9a92;font-family:${SANS};font-size:13px;">${subtext}</p>` : ""}
  </td></tr></table>`;
}

// Backwards-compatible simple button (used by welcome email).
export function ctaButton(href: string, label: string): string {
  return ctaBlock(href, label);
}

function trustBar(): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td align="center" width="33%" style="padding:18px 6px;">
      <p style="margin:0;color:${INK};font-family:${SERIF};font-size:19px;">5.0★</p>
      <p style="margin:3px 0 0;color:#9a9a92;font-family:${SANS};font-size:11px;letter-spacing:.06em;text-transform:uppercase;">Google rating</p>
    </td>
    <td align="center" width="33%" style="padding:18px 6px;border-left:1px solid #e8e4da;border-right:1px solid #e8e4da;">
      <p style="margin:0;color:${INK};font-family:${SERIF};font-size:19px;">500+</p>
      <p style="margin:3px 0 0;color:#9a9a92;font-family:${SANS};font-size:11px;letter-spacing:.06em;text-transform:uppercase;">Apartments cleaned</p>
    </td>
    <td align="center" width="33%" style="padding:18px 6px;">
      <p style="margin:0;color:${INK};font-family:${SERIF};font-size:19px;">100%</p>
      <p style="margin:3px 0 0;color:#9a9a92;font-family:${SANS};font-size:11px;letter-spacing:.06em;text-transform:uppercase;">Guaranteed</p>
    </td>
  </tr></table>`;
}

// ============================================================
// Shared marketing email shell
// ============================================================

export function renderCampaignEmail(opts: {
  preheader: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  siteUrl: string;
}): string {
  const { siteUrl } = opts;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:36px 12px 48px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Masthead -->
        <tr><td style="padding:0 8px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <a href="${siteUrl}" style="text-decoration:none;">
                <span style="color:${GREEN_DARK};font-family:${SERIF};font-size:24px;letter-spacing:-.01em;">Manhattan&nbsp;Mint</span>
              </a>
            </td>
            <td align="right">
              <span style="color:#8a867c;font-family:${SANS};font-size:11px;letter-spacing:.14em;text-transform:uppercase;">NYC Residential Cleaning</span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(30,50,40,.07);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:5px;background:${GREEN_DARK};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="padding:42px 44px 36px;">
              ${opts.bodyHtml}
            </td></tr>
            <tr><td style="padding:0 44px;"><div style="border-top:1px solid #eeeae1;"></div></td></tr>
            <tr><td style="padding:8px 32px 14px;">${trustBar()}</td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:26px 8px 0;text-align:center;">
          <p style="margin:0 0 10px;">
            <a href="${siteUrl}/quote/" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">Book a clean</a>
            <span style="color:#c9c4b8;">&nbsp;·&nbsp;</span>
            <a href="${siteUrl}/#pricing" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">Pricing</a>
            <span style="color:#c9c4b8;">&nbsp;·&nbsp;</span>
            <a href="tel:+19148637902" style="color:${GREEN};font-family:${SANS};font-size:13px;font-weight:600;text-decoration:none;">(914) 863-7902</a>
          </p>
          <p style="margin:0 0 6px;color:#a39e92;font-family:${SANS};font-size:12px;">Questions? Just reply — a real person reads this inbox.</p>
          <p style="margin:0 0 6px;color:#b6b1a5;font-family:${SANS};font-size:11px;">${MAILING_ADDRESS}</p>
          <p style="margin:0;color:#b6b1a5;font-family:${SANS};font-size:11px;">You're getting this because you signed up or booked with us.
            <a href="${opts.unsubscribeUrl}" style="color:#a39e92;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
