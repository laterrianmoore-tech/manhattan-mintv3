import { supabaseAdmin } from "./supabase";

const OPENPHONE_API_KEY = process.env.OPENPHONE_API_KEY!;
const OPENPHONE_FROM_NUMBER = process.env.OPENPHONE_FROM_NUMBER!;

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
    | "other";
};

export async function sendSms(args: SendArgs) {
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
