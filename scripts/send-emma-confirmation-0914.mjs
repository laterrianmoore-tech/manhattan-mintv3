// One-off (2026-09-14): booking confirmation for Emma King, created by hand in
// Supabase (Google LSA lead — never went through /quote, so /api/bookings/submit
// never sent its confirmations). Sends the customer email via SendGrid and the
// customer SMS via OpenPhone, mirroring the wording in app/api/bookings/submit.
// Run from the repo root: node scripts/send-emma-confirmation-0914.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const BOOKING_ID = "a31fb967-b27c-4783-afb0-2e68ff7e65fb";
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);

const { data: booking, error } = await supabase
  .from("bookings")
  .select("*, customers(*)")
  .eq("id", BOOKING_ID)
  .single();
if (error || !booking) {
  console.error("booking not found:", error?.message);
  process.exit(1);
}
const c = booking.customers;
const firstName = c.first_name;
const dateLong = "Friday, September 18";
const serviceLabel = "Deep clean — kitchen, living room, bathroom + oven";
const total = booking.pricing_total;

// ── Email ───────────────────────────────────────────────────────────────────
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
          <h2 style="margin:0 0 8px;color:#0f0f0f;font-size:20px;font-weight:600;">You're all set, ${firstName}!</h2>
          <p style="margin:0 0 28px;color:#555;font-size:15px;">Thanks for reaching out. Your deep clean is confirmed for <strong>${dateLong} at 12:00pm</strong>.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <tr><td style="padding:5px 0;color:#555;font-size:14px;width:140px;">Service</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${serviceLabel}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Date</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${dateLong}</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Arrival</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">12:00pm</td></tr>
            <tr><td style="padding:5px 0;color:#555;font-size:14px;">Address</td><td style="padding:5px 0;color:#0f0f0f;font-size:14px;font-weight:500;">${c.address}</td></tr>
            <tr><td style="padding:8px 0 0;color:#555;font-size:14px;border-top:1px solid #e0e0e0;">Total</td><td style="padding:8px 0 0;color:#2d6a4f;font-size:16px;font-weight:700;border-top:1px solid #e0e0e0;">$${total}</td></tr>
          </table>

          <p style="margin:0 0 6px;color:#555;font-size:14px;">🏠 <strong>One quick thing:</strong> we don't have your apartment number yet. Just reply to this email or text it to us and we'll add it to the booking.</p>
          <p style="margin:0 0 24px;color:#555;font-size:14px;">💳 <strong>Payment:</strong> nothing is due now. We'll send a secure payment link once the clean is complete.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f4;border-radius:8px;padding:18px 24px;margin-bottom:24px;">
            <tr><td>
              <p style="margin:0 0 10px;color:#0f0f0f;font-size:14px;font-weight:600;">✨ How to prep for your clean</p>
              <p style="margin:0 0 6px;color:#555;font-size:13px;">💎 To keep your treasured items safe, please store away jewelry, cash, and fragile valuables — it lets your cleaner work confidently in every corner.</p>
              <p style="margin:0 0 6px;color:#555;font-size:13px;">🔥 Please make sure the oven is cool and empty before we arrive.</p>
              <p style="margin:0;color:#555;font-size:13px;">🔑 Double-check your building access notes — doorman, key, or codes — so your cleaner can get right to work.</p>
            </td></tr>
          </table>

          <p style="margin:0;color:#888;font-size:13px;">Need to cancel or reschedule? Please give us at least 24 hours notice. Questions? Reply to this email or text us at <a href="tel:+19148637902" style="color:#2d6a4f;">(914) 863-7902</a>.</p>
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
const emailRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: c.email, name: `${c.first_name} ${c.last_name}` }], ...(ownerCopy.length ? { bcc: ownerCopy.map((e) => ({ email: e })) } : {}) }],
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME || "Manhattan Mint" },
    subject: "Booking Confirmed — Manhattan Mint",
    content: [{ type: "text/html", value: html }],
  }),
});
console.log("SendGrid HTTP", emailRes.status, emailRes.status === 202 ? "ACCEPTED" : await emailRes.text());

// ── SMS ─────────────────────────────────────────────────────────────────────
const sms = `Thanks for booking Manhattan Mint, ${firstName}! You're confirmed for Fri Sep 18 at 12pm — deep clean of the kitchen, living room, and bathroom, plus the oven ($${total}). Could you reply with your apartment number? If you need to cancel or reschedule, please give us at least 24 hours notice. — Manhattan Mint NYC`;

const smsRes = await fetch("https://api.openphone.com/v1/messages", {
  method: "POST",
  headers: { Authorization: env.OPENPHONE_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ from: env.OPENPHONE_FROM_NUMBER, to: [c.phone], content: sms }),
});
const smsData = await smsRes.json().catch(() => ({}));
console.log("OpenPhone HTTP", smsRes.status, smsRes.ok ? `sent id=${smsData?.data?.id}` : JSON.stringify(smsData).slice(0, 400));

await supabase.from("dispatch_log").insert({
  cleaner_id: null,
  booking_id: BOOKING_ID,
  recipient_type: "customer",
  to_phone: c.phone,
  message_body: sms,
  openphone_message_id: smsData?.data?.id ?? null,
  event_type: "other",
  status: smsRes.ok ? "sent" : "failed",
  error_message: smsRes.ok ? null : JSON.stringify(smsData).slice(0, 500),
});
console.log("dispatch_log row inserted.");
