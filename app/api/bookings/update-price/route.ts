import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

// Admin-only: change what a booking will be charged. Must happen before
// the cleaner taps "Job Complete" — the auto-charge uses pricing_total.
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, newTotal } = await req.json();
  if (!bookingId || typeof newTotal !== "number" || !Number.isInteger(newTotal)) {
    return NextResponse.json({ ok: false, error: "bookingId and a whole-dollar newTotal are required" }, { status: 400 });
  }
  if (newTotal < 0 || newTotal > 5000) {
    return NextResponse.json({ ok: false, error: "Amount must be between $0 and $5,000" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("id, status, pricing_total, stripe_charge_id")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json({ ok: false, error: `Can't reprice a ${booking.status} job.` }, { status: 400 });
  }
  if (booking.stripe_charge_id) {
    return NextResponse.json(
      { ok: false, error: "This job was already charged — adjust it in the Stripe dashboard (refund or extra charge)." },
      { status: 400 },
    );
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({ pricing_total: newTotal })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[update-price] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, oldTotal: booking.pricing_total, newTotal });
}
