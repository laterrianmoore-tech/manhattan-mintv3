import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

// Admin-only (2026-10-20): the owner's personal Google-review ask, sent by
// hand from the Reviews action list on /admin/dispatch. Nothing automatic
// sends this; the owner taps it per customer. The wording is the text the
// owner approved on 2026-10-20 (first sent to Mink K.). Success stamps
// review_nudge_sent_at, which now means "owner asked personally".
//
// Body: { bookingId: string }
const REVIEW_URL = "https://g.page/r/CeslAughOLhZEBM/review";

export function ownerReviewAsk(firstName: string, cleanerFirstName: string | null, sameDay: boolean) {
  const when = sameDay ? "today" : "this week";
  const who = cleanerFirstName ? `I hope ${cleanerFirstName} left it spotless.` : "I hope it was left spotless.";
  return `Hi ${firstName}, this is the owner of Manhattan Mint. Thank you for trusting us with your place ${when}. ${who} If you have 30 seconds, a quick Google review means the world to a small business: ${REVIEW_URL}\n\nThank you again.`;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("mm_admin")?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const bookingId = body?.bookingId;
  if (!bookingId || typeof bookingId !== "string") {
    return NextResponse.json({ ok: false, error: "bookingId required" }, { status: 400 });
  }

  const { data: b, error } = await supabaseAdmin
    .from("bookings")
    .select("id, service_date, status, assigned_cleaner_id, review_received_at, review_nudge_sent_at, customers(first_name, phone)")
    .eq("id", bookingId)
    .single();
  if (error || !b) return NextResponse.json({ ok: false, error: error?.message ?? "Booking not found" }, { status: 404 });
  const customer = (b as any).customers as { first_name?: string; phone?: string } | null;
  if (!customer?.phone) return NextResponse.json({ ok: false, error: "Customer has no phone on file" }, { status: 400 });
  if ((b as any).review_received_at) return NextResponse.json({ ok: false, error: "Review already received" }, { status: 400 });

  let cleanerFirst: string | null = null;
  if ((b as any).assigned_cleaner_id) {
    const { data: c } = await supabaseAdmin.from("cleaners").select("first_name").eq("id", (b as any).assigned_cleaner_id).single();
    cleanerFirst = c?.first_name ?? null;
  }
  const todayNY = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const text = ownerReviewAsk(customer.first_name || "there", cleanerFirst, (b as any).service_date === todayNY);

  const sms = await sendSms({
    to: customer.phone,
    body: text,
    bookingId,
    recipientType: "customer",
    eventType: "other",
  });
  if (!sms.ok) return NextResponse.json({ ok: false, error: sms.errorMessage ?? "Text failed to send" }, { status: 502 });

  const sentAt = new Date().toISOString();
  const { error: stampErr } = await supabaseAdmin.from("bookings").update({ review_nudge_sent_at: sentAt }).eq("id", bookingId);
  if (stampErr) console.error("[review-ask] sent but not stamped:", stampErr.message);
  return NextResponse.json({ ok: true, bookingId, sentAt, text });
}
