import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

// Admin-only: override a job's cleaner pay (2026-10-08). Dispatch sets pay from
// the table; this is the owner's hand on the number — a neglected apartment,
// a bespoke deep clean, a rate agreed by text. Marks the pay "manual" so a
// later re-dispatch doesn't overwrite it. If the cleaner was already texted
// the job, they get a one-line pay update so the number they were told is
// never stale.
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, amount, slot: rawSlot, note } = await req.json();
  const slot: "primary" | "second" = rawSlot === "second" ? "second" : "primary";
  if (!bookingId || typeof amount !== "number" || !Number.isInteger(amount)) {
    return NextResponse.json({ ok: false, error: "bookingId and a whole-dollar amount are required" }, { status: 400 });
  }
  if (amount < 0 || amount > 1000) {
    return NextResponse.json({ ok: false, error: "Pay must be between $0 and $1,000" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("*, customers(first_name, address, apt_no)")
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
  const cleanerIdForSlot: string | null = slot === "second" ? b.second_cleaner_id : b.assigned_cleaner_id;

  const payColumn = slot === "second" ? "second_cleaner_pay" : "cleaner_pay";
  const previous: number | null = b[payColumn] ?? null;
  const update: Record<string, unknown> = { [payColumn]: amount };
  if (slot === "primary") {
    update.cleaner_pay_source = "manual";
    if (typeof note === "string" && note.trim()) update.cleaner_pay_note = note.trim().slice(0, 200);
  }
  const { error: updateErr } = await supabaseAdmin.from("bookings").update(update).eq("id", bookingId);
  if (updateErr) {
    console.error("[update-pay] UPDATE failed:", updateErr);
    const hint = /column .* does not exist/i.test(updateErr.message)
      ? " Run lib/supabase/migrations/2026-10-08-cleaner-pay.sql in the Supabase SQL editor first."
      : "";
    return NextResponse.json({ ok: false, error: updateErr.message + hint }, { status: 500 });
  }

  // Tell the cleaner if they were already texted the job (and the number changed).
  let cleanerTexted = false;
  if (cleanerIdForSlot && b.dispatch_sms_sent_at && previous !== amount && !b.completed_at) {
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", cleanerIdForSlot)
      .single();
    if (cleaner?.phone) {
      const customer = b.customers as any;
      const serviceDate = new Date(b.service_date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
      const result = await sendSms({
        to: cleaner.phone,
        body: `PAY UPDATE — ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix} pays $${amount}.`,
        cleanerId: cleaner.id,
        bookingId,
        recipientType: "cleaner",
        eventType: "other",
      });
      cleanerTexted = result.ok;
    }
  }

  return NextResponse.json({ ok: true, slot, previous, amount, cleanerTexted });
}
