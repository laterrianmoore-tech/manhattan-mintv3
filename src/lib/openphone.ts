import sgMail from "@sendgrid/mail";
import { supabaseAdmin } from "./supabase";

const OPENPHONE_API_KEY = process.env.OPENPHONE_API_KEY!;
const OPENPHONE_FROM_NUMBER = process.env.OPENPHONE_FROM_NUMBER!;

// SMS is a critical path (dispatch, reminders, status updates) — when OpenPhone
// rejects a send (e.g. out of prepaid credits, Aug 2026), the owner must hear
// about it even though SMS itself is down, so fall back to email.
async function emailOwnerSmsFailure(args: SendArgs, errorMessage: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const to = process.env.OWNER_NOTIFY_EMAIL || process.env.SENDGRID_TO_EMAIL;
  if (!apiKey || !from || !to) return;
  try {
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to: to.split(",").map((e) => e.trim()),
      from: { email: from, name: process.env.SENDGRID_FROM_NAME || "Manhattan Mint" },
      subject: `⚠️ SMS FAILED — ${args.eventType} text to ${args.recipientType} did not send`,
      text: [
        `An automated text failed to send.`,
        ``,
        `Type: ${args.eventType} (${args.recipientType})`,
        `To: ${args.to}`,
        `Booking: ${args.bookingId ?? "-"}`,
        `Error: ${errorMessage}`,
        ``,
        `If the error mentions credits, top up prepaid credits in OpenPhone (Settings → Billing) and turn on auto-recharge.`,
        `Message that failed:`,
        args.body,
      ].join("\n"),
    });
  } catch (e) {
    console.error("[sendSms] owner failure-alert email also failed:", e);
  }
}

type SendArgs = {
  to: string;
  body: string;
  cleanerId?: string | null;
  bookingId?: string | null;
  recipientType: "cleaner" | "customer";
  eventType:
    | "dispatch"
    | "on_the_way"
    | "arrived"
    | "completed"
    | "cancelled"
    | "rescheduled"
    | "reassigned"
    | "reminder"
    | "other";
};

// OpenPhone only accepts E.164 (+15551234567). Customer-entered phones arrive
// in every format — "(571) 325-7606", "5713257606" — so normalize before sending.
export function toE164(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(phone || "").startsWith("+") ? String(phone) : `+${digits}`;
}

export async function sendSms(args: SendArgs) {
  args = { ...args, to: toE164(args.to) };
  let openphoneMessageId: string | null = null;
  let status: "sent" | "failed" = "failed";
  let errorMessage: string | null = null;

  try {
    const res = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: OPENPHONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: OPENPHONE_FROM_NUMBER,
        to: [args.to],
        content: args.body,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage = JSON.stringify(data).slice(0, 500);
    } else {
      openphoneMessageId = data?.data?.id ?? null;
      status = "sent";
    }
  } catch (err: any) {
    errorMessage = err?.message ?? "unknown error";
  }

  if (status === "failed") {
    console.error(`[sendSms] ${args.eventType} to ${args.recipientType} failed:`, errorMessage);
    await emailOwnerSmsFailure(args, errorMessage ?? "unknown error");
  }

  await supabaseAdmin.from("dispatch_log").insert({
    cleaner_id: args.cleanerId ?? null,
    booking_id: args.bookingId ?? null,
    recipient_type: args.recipientType,
    to_phone: args.to,
    message_body: args.body,
    openphone_message_id: openphoneMessageId,
    event_type: args.eventType,
    status,
    error_message: errorMessage,
  });

  return { ok: status === "sent", openphoneMessageId, errorMessage };
}
