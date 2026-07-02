// Diagnostic: verify SendGrid mail-send works with the configured key.
// Sends ONE test email to SENDGRID_TO_EMAIL. Prints HTTP status + errors, no secrets.
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: env.SENDGRID_TO_EMAIL }] }],
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME || "Manhattan Mint" },
    subject: "SendGrid diagnostic test — Manhattan Mint booking alerts",
    content: [{ type: "text/plain", value: "Test email verifying booking-alert delivery. Sent by the diagnostic script while debugging missed booking notifications. If you see this, SendGrid mail-send works with the local API key." }],
  }),
});

console.log("HTTP", res.status, res.statusText);
const text = await res.text();
if (text) console.log(text.slice(0, 600));
console.log(res.status === 202 ? "RESULT: SendGrid ACCEPTED the send (delivery pending)" : "RESULT: SendGrid REJECTED the send");
