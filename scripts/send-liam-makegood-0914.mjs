// One-off (2026-09-14): make-good email to Liam Schorr after the 9/14 clean was
// interrupted mid-job. Gives him the personal LIAMFREE code (see
// app/api/bookings/submit — locked to his email, single use).
// Run from the repo root AFTER the LIAMFREE code is deployed:
//   node scripts/send-liam-makegood-0914.mjs
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const TO = { email: "liamschorr@gmail.com", name: "Liam Schorr" };

const paragraphs = [
  `Hi Liam,`,
  `Thank you for booking with Manhattan Mint today, and I'm sorry for the inconvenience. Your cleaner had to step away partway through, and a clean that stops and starts isn't the experience you booked. That's on us, not you.`,
  `I'd like to make it right: your next clean is free. When you're ready, book at <a href="https://manhattanmintnyc.com/quote" style="color:#2d6a4f;">manhattanmintnyc.com/quote</a> and enter the code <strong>LIAMFREE</strong> in the coupon field. The total drops to $0 and nothing is charged to your card. The code is tied to your email and good for one clean of any size.`,
  `If anything from today needs another pass sooner than that, reply to this email or text me at <a href="tel:+19148637902" style="color:#2d6a4f;">(914) 863-7902</a> and I'll take care of it personally.`,
  `Thank you for giving us the chance to earn back your trust.`,
];

const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#2d6a4f;padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;letter-spacing:-0.3px;">Manhattan Mint</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">NYC Residential Cleaning</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 20px;color:#0f0f0f;font-size:20px;font-weight:600;">Your next clean is on us</h2>
          ${paragraphs.map((p) => `<p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">${p}</p>`).join("")}
          <p style="margin:24px 0 0;color:#444;font-size:15px;line-height:1.6;">Laterrian<br><span style="color:#888;font-size:13px;">Manhattan Mint NYC</span></p>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">Manhattan Mint NYC LLC · New York, NY · <a href="https://manhattanmintnyc.com" style="color:#aaa;">manhattanmintnyc.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const ownerCopy = (env.OWNER_NOTIFY_EMAIL || env.SENDGRID_TO_EMAIL || "").split(",").map((a) => a.trim()).filter(Boolean);
const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    personalizations: [{ to: [TO], ...(ownerCopy.length ? { bcc: ownerCopy.map((e) => ({ email: e })) } : {}) }],
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME || "Manhattan Mint" },
    reply_to: { email: env.SENDGRID_FROM_EMAIL },
    subject: "Your next clean is on us, Liam",
    content: [{ type: "text/html", value: html }],
  }),
});
console.log("SendGrid HTTP", res.status, res.status === 202 ? "ACCEPTED" : await res.text());
