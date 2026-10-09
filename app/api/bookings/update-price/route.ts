import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { inspectHold } from "@/lib/stripe-hold";

// Admin-only: change what a booking will be charged. Must happen before
// the cleaner taps "Job Complete" — the auto-charge uses pricing_total.
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // applyToFuture (2026-10-09): also set pricing_next_clean_total, so the
  // auto-created next visit carries the new rate. Left off, the edit is a
  // one-visit deal and the next booking returns to the standing rate — which
  // is how a welcome rate expires on its own.
  const { bookingId, newTotal, applyToFuture } = await req.json();
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
  // stripe_charge_id is a hold until Job Complete captures it. A live hold
  // is fine to reprice: Job Complete captures up to the held amount and
  // charges any increase separately. A captured one is money already moved.
  let holdNote = "";
  if (booking.stripe_charge_id) {
    const hold = await inspectHold(booking.stripe_charge_id);
    if (hold.state === "held") {
      holdNote = newTotal > hold.amount
        ? ` The card hold is $${hold.amount}; the extra $${newTotal - hold.amount} is charged separately at Job Complete.`
        : newTotal < hold.amount
          ? ` Only $${newTotal} of the $${hold.amount} hold will be captured; the rest is released.`
          : "";
    } else if (hold.state !== "gone") {
      return NextResponse.json(
        { ok: false, error: "This job was already charged — adjust it in the Stripe dashboard (refund or extra charge)." },
        { status: 400 },
      );
    }
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update(applyToFuture === true ? { pricing_total: newTotal, pricing_next_clean_total: newTotal } : { pricing_total: newTotal })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[update-price] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, oldTotal: booking.pricing_total, newTotal, holdNote });
}
