import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

// Admin-only: override a job's cleaner pay (2026-10-08). Dispatch sets pay from
// the table; this is the owner's hand on the number — a neglected apartment,
// a bespoke deep clean, a rate agreed by text. Marks the pay "manual" so a
// later re-dispatch doesn't overwrite it. Owner rule 2026-10-12: pay changes
// are internal only — the cleaner is NOT texted a pay update. Any pay
// conversation happens by the owner's own hand.
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, amount, slot: rawSlot, note } = await req.json();
  const slot: "primary" | "second" = rawSlot === "second" ? "second" : "primary";
  // amount null (primary slot, 2026-11-01) = "No pay line": the owner settles
  // this job's pay by hand. The pay stays empty but the source is "manual", so
  // dispatch computes nothing from the table and texts no Pay line.
  const noPay = amount === null && slot === "primary";
  if (!bookingId || (!noPay && (typeof amount !== "number" || !Number.isInteger(amount)))) {
    return NextResponse.json({ ok: false, error: "bookingId and a whole-dollar amount (or null for no pay line) are required" }, { status: 400 });
  }
  if (!noPay && (amount < 0 || amount > 1000)) {
    return NextResponse.json({ ok: false, error: "Pay must be between $0 and $1,000" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }
  const b = booking as any;
  if (b.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "Can't set pay on a cancelled job." }, { status: 400 });
  }
  const paidAt = slot === "second" ? b.second_cleaner_paid_at : b.cleaner_paid_at;
  if (paidAt) {
    return NextResponse.json(
      { ok: false, error: "This pay was already sent out. Adjust it with a separate transfer and note it in /admin/accounting." },
      { status: 400 },
    );
  }
  const payColumn = slot === "second" ? "second_cleaner_pay" : "cleaner_pay";
  const previous: number | null = b[payColumn] ?? null;
  const update: Record<string, unknown> = { [payColumn]: noPay ? null : amount };
  if (slot === "primary") {
    update.cleaner_pay_source = "manual";
    if (typeof note === "string" && note.trim()) update.cleaner_pay_note = note.trim().slice(0, 200);
    else if (noPay) update.cleaner_pay_note = "No pay line — settled by hand";
  }
  const { error: updateErr } = await supabaseAdmin.from("bookings").update(update).eq("id", bookingId);
  if (updateErr) {
    console.error("[update-pay] UPDATE failed:", updateErr);
    const hint = /column .* does not exist/i.test(updateErr.message)
      ? " Run lib/supabase/migrations/2026-10-08-cleaner-pay.sql in the Supabase SQL editor first."
      : "";
    return NextResponse.json({ ok: false, error: updateErr.message + hint }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slot, previous, amount: noPay ? null : amount, noPay });
}
