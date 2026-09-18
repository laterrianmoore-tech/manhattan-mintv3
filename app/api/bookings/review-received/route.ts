import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

// Admin-only: record that a customer's Google review came in (or undo it).
// Google gives no webhook for new reviews, so the owner marks it by hand from
// the Reviews table on /admin/dispatch. Same cookie auth as update-price.
//
// Body: { bookingId: string, received?: boolean }  (received defaults to true)
async function handle(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const bookingId = body?.bookingId;
  const received = body?.received ?? true;
  if (!bookingId || typeof bookingId !== "string" || typeof received !== "boolean") {
    return NextResponse.json({ ok: false, error: "bookingId (string) and optional received (boolean) required" }, { status: 400 });
  }

  const receivedAt = received ? new Date().toISOString() : null;
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ review_received_at: receivedAt })
    .eq("id", bookingId)
    .select("id");

  if (error) {
    console.error("[review-received] UPDATE failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, bookingId, review_received_at: receivedAt });
}

export { handle as POST, handle as PATCH };
