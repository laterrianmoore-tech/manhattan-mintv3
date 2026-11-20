import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { classifyJob, computeCleanerPay, payNote, type PayResult } from "@/lib/cleaner-pay";
import { arrivalTagFor } from "@/lib/arrival-window";

// Assigns a cleaner to a booking and texts them the job.
//
// A job holds up to two cleaners: the primary in assigned_cleaner_id and an
// optional second in second_cleaner_id. `slot` picks which one this call sets
// (default "primary", so older callers are unchanged). For the second slot a
// null / empty cleanerId removes the second cleaner and tells them they're off.
type Slot = "primary" | "second";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { bookingId, cleanerId, slot: rawSlot, action, pay: payOverride } = await req.json();
  const slot: Slot = rawSlot === "second" ? "second" : "primary";
  const column = slot === "second" ? "second_cleaner_id" : "assigned_cleaner_id";

  if (!bookingId || (!cleanerId && slot === "primary" && !action)) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("*, customers(*)")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json(
      { ok: false, error: `Can't dispatch a ${booking.status} booking.` },
      { status: 400 }
    );
  }

  if (slot === "second" && !booking.assigned_cleaner_id) {
    return NextResponse.json(
      { ok: false, error: "Assign the first cleaner before adding a second." },
      { status: 400 }
    );
  }

  const otherSlotId = slot === "second" ? booking.assigned_cleaner_id : booking.second_cleaner_id;
  if (cleanerId && otherSlotId && otherSlotId === cleanerId) {
    return NextResponse.json(
      { ok: false, error: "That cleaner is already on this job." },
      { status: 400 }
    );
  }

  const customer = booking.customers as any;
  const serviceDate = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : booking.preferred_time_ranges || "";
  const aptSuffix = customer?.apt_no ? ` Apt ${customer.apt_no}` : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";
  // Exact arrival time when the booking has one (cleaners asked "what time?"
  // when the text only said "Evening").
  const arrival = arrivalTagFor(booking, "dispatch text");
  const whenLine = `\n${serviceDate} ${timeRange}${arrival ? ` — arrive ${arrival}` : ""} · ${customer?.address}${aptSuffix}`;

  const previousCleanerId: string | null = booking[column] ?? null;

  // Tell a cleaner who was already texted the job that they're off it.
  async function notifyOff(cleanerIdOff: string) {
    const { data: previousCleaner } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", cleanerIdOff)
      .single();
    if (!previousCleaner?.phone) return false;
    const result = await sendSms({
      to: previousCleaner.phone,
      body: `REASSIGNED — you're off ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix}. No need to go.`,
      cleanerId: previousCleaner.id,
      bookingId,
      recipientType: "cleaner",
      eventType: "reassigned",
    });
    return result.ok;
  }

  // ── Swap who leads a 2-person job (2026-11-20) ─────────────────────────
  // Both cleaners stay on the job, so nobody is texted: the slots and their
  // pay just trade places.
  if (action === "swap_lead") {
    if (!booking.assigned_cleaner_id || !booking.second_cleaner_id) {
      return NextResponse.json({ ok: false, error: "This job has only one cleaner." }, { status: 400 });
    }
    const { error: swapErr } = await supabaseAdmin
      .from("bookings")
      .update({
        assigned_cleaner_id: booking.second_cleaner_id,
        second_cleaner_id: booking.assigned_cleaner_id,
        cleaner_pay: booking.second_cleaner_pay ?? null,
        second_cleaner_pay: booking.cleaner_pay ?? null,
      })
      .eq("id", bookingId);
    if (swapErr) return NextResponse.json({ ok: false, error: swapErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, swapped: true });
  }

  // ── Take one cleaner off a 2-person job (2026-11-20) ───────────────────
  // slot "second" + no cleanerId: the 2nd cleaner comes off. action
  // "remove_primary": the lead comes off and the 2nd moves up. Either way the
  // one who stays gets a single clear text that it is now a solo job, with the
  // solo pay. Before this, taking the lead off meant reassigning through a
  // placeholder, and the staying cleaner was texted "you're off" and then a
  // fresh "new job" naming the wrong teammate (Sun Nov 22, Alyssa).
  if ((slot === "second" && !cleanerId) || action === "remove_primary") {
    const removingLead = action === "remove_primary";
    const offId: string | null = removingLead ? booking.assigned_cleaner_id : booking.second_cleaner_id;
    const stayId: string | null = removingLead ? booking.second_cleaner_id : booking.assigned_cleaner_id;
    if (!offId) return NextResponse.json({ ok: true, removed: false });
    if (!stayId) {
      return NextResponse.json(
        { ok: false, error: "Only one cleaner on this job. Use Change cleaner instead." },
        { status: 400 }
      );
    }

    // Solo pay for the cleaner who stays: the owner's number if given,
    // otherwise the pay table for one cleaner.
    const typedPay = payOverride != null && payOverride !== "" ? Number(payOverride) : null;
    if (typedPay != null && (!Number.isFinite(typedPay) || typedPay < 0)) {
      return NextResponse.json({ ok: false, error: "Pay must be a number." }, { status: 400 });
    }
    let soloPay: number | null = typedPay;
    if (soloPay == null) {
      const { count: priorJobs } = await supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", booking.customer_id)
        .eq("status", "completed")
        .neq("id", bookingId)
        .or(`assigned_cleaner_id.eq.${stayId},second_cleaner_id.eq.${stayId}`);
      soloPay = computeCleanerPay({ ...booking, isRegularCleaner: (priorJobs ?? 0) > 0, twoCleaners: false }).amount;
    }

    const { error: clearErr } = await supabaseAdmin
      .from("bookings")
      .update({
        assigned_cleaner_id: stayId,
        second_cleaner_id: null,
        second_cleaner_pay: null,
        cleaner_pay: soloPay,
        cleaner_pay_source: "manual",
        cleaner_pay_note: typedPay != null ? "Solo after a cleaner came off (owner set)" : "Solo after a cleaner came off (pay table)",
      })
      .eq("id", bookingId);
    if (clearErr) {
      console.error("[dispatch] take cleaner off failed:", clearErr);
      return NextResponse.json({ ok: false, error: clearErr.message }, { status: 500 });
    }

    let previousCleanerNotified = false;
    let stayingNotified = false;
    if (booking.dispatch_sms_sent_at) {
      previousCleanerNotified = await notifyOff(offId);
      const { data: offCleaner } = await supabaseAdmin.from("cleaners").select("first_name").eq("id", offId).single();
      const { data: stay } = await supabaseAdmin
        .from("cleaners")
        .select("id, phone, portal_token")
        .eq("id", stayId)
        .single();
      if (stay?.phone) {
        const hidePay = booking.cleaner_pay_hidden === true && !removingLead;
        const result = await sendSms({
          to: stay.phone,
          body: `JOB UPDATE — ${offCleaner?.first_name ?? "Your teammate"} is off ${customer?.first_name}'s ${serviceDate} job. It's now a solo job, just you.${whenLine}${
            soloPay != null && !hidePay ? `\nPay: $${soloPay}` : ""
          }${stay.portal_token ? `\nView: ${siteUrl}/cleaner/${stay.portal_token}` : ""}`,
          cleanerId: stay.id,
          bookingId,
          recipientType: "cleaner",
          eventType: "other",
        });
        stayingNotified = result.ok;
      }
    }
    return NextResponse.json({ ok: true, removed: true, previousCleanerNotified, stayingNotified, pay: soloPay });
  }

  // ── Assign / replace a cleaner in this slot ────────────────────────────
  const { data: cleaner, error: cleanerErr } = await supabaseAdmin
    .from("cleaners")
    .select("id, first_name, last_name, phone, portal_token")
    .eq("id", cleanerId)
    .single();

  if (cleanerErr || !cleaner) {
    return NextResponse.json({ ok: false, error: "Cleaner not found" }, { status: 404 });
  }

  if (!cleaner.portal_token) {
    return NextResponse.json({ ok: false, error: "Cleaner has no portal token" }, { status: 400 });
  }

  // Switching cleaners on an already-dispatched job — tell the old cleaner they're off it
  const isReassignment =
    previousCleanerId && previousCleanerId !== cleanerId && booking.dispatch_sms_sent_at;

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({
      [column]: cleanerId,
      status: booking.status === "in_progress" ? "in_progress" : "confirmed",
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[dispatch] UPDATE failed:", updateErr);
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Name the teammate in the job text so each cleaner knows it's a 2-person job.
  let teammateLine = "";
  if (otherSlotId) {
    const { data: teammate } = await supabaseAdmin
      .from("cleaners")
      .select("first_name")
      .eq("id", otherSlotId)
      .single();
    if (teammate?.first_name) teammateLine = `\n2-person job — with ${teammate.first_name}`;
  }

  // ── Cleaner pay (2026-10-08) ──────────────────────────────────────────
  // Set from the pay table unless the owner has taken this job's pay in hand
  // (source "manual"): a number they typed, texted with the job so the rate is
  // known before the cleaner goes, or — since 2026-11-01 — no number at all
  // ("No pay line" on Edit pay), in which case nothing is computed and the job
  // text carries no Pay line; the owner settles that pay by hand. Stored in a
  // separate update that is allowed to fail: a database without the pay
  // columns still dispatches normally.
  const payColumn = slot === "second" ? "second_cleaner_pay" : "cleaner_pay";
  const existingPay: number | null = booking[payColumn] ?? null;
  // The source column belongs to the primary slot, so there "manual" alone is
  // the owner's call even with no amount; the second slot needs a saved number.
  const manualPay = booking.cleaner_pay_source === "manual" && (slot === "primary" || existingPay != null);
  // Pay recorded but kept off the text (2026-11-02, primary slot): the owner
  // set a number for accounting and payroll but does not want the cleaner to
  // see it on the job text (e.g. pay combined across two visits).
  const payHidden = slot === "primary" && manualPay && booking.cleaner_pay_hidden === true;
  let pay: PayResult | null = null;
  let payAmount: number | null = manualPay ? existingPay : null;
  let payNeedsOwner = false;
  if (!manualPay) {
    const kind = classifyJob(booking);
    if (slot === "second" && kind !== "reclean") {
      // The table only splits re-cleans. Any other 2-person job is priced by hand.
      payNeedsOwner = true;
    } else {
      // "Regular cleaner": has finished a job for this customer before, so a
      // recurring visit pays the recurring row.
      const { count: priorJobs } = await supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", booking.customer_id)
        .eq("status", "completed")
        .neq("id", bookingId)
        .or(`assigned_cleaner_id.eq.${cleanerId},second_cleaner_id.eq.${cleanerId}`);
      pay = computeCleanerPay({
        ...booking,
        isRegularCleaner: (priorJobs ?? 0) > 0,
        twoCleaners: !!otherSlotId,
      });
      payAmount = pay.amount;
      const payUpdate: Record<string, unknown> = { [payColumn]: pay.amount };
      if (slot === "primary") {
        payUpdate.cleaner_pay_source = "auto";
        payUpdate.cleaner_pay_note = payNote(pay);
      }
      const { error: payErr } = await supabaseAdmin.from("bookings").update(payUpdate).eq("id", bookingId);
      if (payErr) {
        console.error("[dispatch] cleaner pay not stored (run migrations/2026-10-08-cleaner-pay.sql):", payErr.message);
        payAmount = null; // don't text a number the system didn't record
      }
    }
  }
  const payTextLine = payAmount != null && !payHidden ? `\nPay: $${payAmount}` : "";

  const body = `New job — ${serviceDate} ${timeRange}${arrival ? ` — arrive ${arrival}` : ""}
${customer?.first_name} · ${customer?.address}${aptSuffix}
${booking.bedrooms}BR · ${booking.service_summary}${teammateLine}${payTextLine}
View: ${siteUrl}/cleaner/${cleaner.portal_token}`;

  const smsResult = await sendSms({
    to: cleaner.phone,
    body,
    cleanerId,
    bookingId,
    recipientType: "cleaner",
    eventType: "dispatch",
  });

  // Only stamp dispatch_sms_sent_at when the cleaner actually got the text —
  // downstream flows (reminders, cancel/reschedule notices) key off it.
  if (smsResult.ok) {
    await supabaseAdmin
      .from("bookings")
      .update({ dispatch_sms_sent_at: new Date().toISOString() })
      .eq("id", bookingId);
  }

  // When a second cleaner joins a job the primary was already texted about,
  // let the primary know they now have a teammate.
  let teammateNotified = false;
  // Since 2026-11-20 this covers either slot: the cleaner who stays on a
  // 2-person job hears who their teammate now is, and whom they replace.
  if (otherSlotId && booking.dispatch_sms_sent_at && previousCleanerId !== cleanerId) {
    const { data: teammate } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("id", otherSlotId)
      .single();
    let replacedName: string | null = null;
    if (previousCleanerId) {
      const { data: prev } = await supabaseAdmin.from("cleaners").select("first_name").eq("id", previousCleanerId).single();
      replacedName = prev?.first_name ?? null;
    }
    if (teammate?.phone) {
      const result = await sendSms({
        to: teammate.phone,
        body: replacedName
          ? `TEAM UPDATE — ${cleaner.first_name} replaces ${replacedName} on ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix}. Still a 2-person job.`
          : `TEAM UPDATE — ${cleaner.first_name} is joining you on ${customer?.first_name}'s ${serviceDate} job at ${customer?.address}${aptSuffix}.`,
        cleanerId: teammate.id,
        bookingId,
        recipientType: "cleaner",
        eventType: "other",
      });
      teammateNotified = result.ok;
    }
  }

  const previousCleanerNotified = isReassignment ? await notifyOff(previousCleanerId!) : false;

  return NextResponse.json({
    ok: true,
    slot,
    previousCleanerNotified,
    teammateNotified,
    smsSent: smsResult.ok,
    smsError: smsResult.ok ? null : smsResult.errorMessage,
    pay: payAmount,
    paySource: manualPay ? "manual" : payAmount != null ? "auto" : null,
    payByHand: manualPay && payAmount == null,
    payHidden,
    payNote: pay ? payNote(pay) : null,
    payWarnings: pay ? [...pay.warnings, ...pay.assumptions] : [],
    payNeedsOwner,
  });
}
