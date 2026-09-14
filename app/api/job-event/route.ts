import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { chargeCustomer } from "@/lib/stripe-charge";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const ORDINALS = ["1st", "2nd", "3rd", "4th"];

// A monthly customer on a weekday cadence ("2nd Wednesday each month") has it
// written in cleaning_notes, the same place the arrival window lives. Returns
// { nth, weekday } or null when the notes don't name one.
function monthlyCadence(notes: string | null | undefined) {
  const m = (notes ?? "").match(
    /\b(1st|2nd|3rd|4th|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i
  );
  if (!m) return null;
  return { nth: m[1].toLowerCase(), weekday: WEEKDAYS.indexOf(m[2].toLowerCase()) };
}

// The Nth (or last) given weekday of a month. Computed in UTC so the answer
// doesn't depend on the server's timezone.
function nthWeekdayOfMonth(year: number, monthIndex: number, nth: string, weekday: number): Date {
  if (nth === "last") {
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() - weekday + 7) % 7));
    return end;
  }
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, 1 + offset + 7 * ORDINALS.indexOf(nth)));
}

// Next service date for a recurring frequency, from the just-completed date.
// Monthly follows a weekday cadence when the notes give one (Katherine C. is
// "2nd Wednesday" — adding a calendar month put her on the 3rd Wednesday);
// otherwise it's the same day next month.
function nextServiceDate(serviceDate: string, frequency: string, notes?: string | null): string | null {
  const d = new Date(serviceDate + "T12:00:00Z");
  if (frequency === "Weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === "Bi-Weekly") d.setUTCDate(d.getUTCDate() + 14);
  else if (frequency === "Monthly") {
    const cadence = monthlyCadence(notes);
    if (cadence) {
      const next = nthWeekdayOfMonth(d.getUTCFullYear(), d.getUTCMonth() + 1, cadence.nth, cadence.weekday);
      return next.toISOString().slice(0, 10);
    }
    d.setUTCMonth(d.getUTCMonth() + 1);
  } else return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const { token, bookingId, event } = await req.json();

  if (!bookingId || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Two ways in: the cleaner's own portal token, or an admin session from
  // /admin/dispatch. The admin path exists so the owner can advance a job on
  // behalf of a cleaner who has no portal token — an outside cover such as a
  // TaskRabbit booking, or a cleaner whose phone is dead mid-job.
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("mm_admin")?.value === process.env.ADMIN_PASSWORD;

  let cleaner: { id: string; first_name: string; phone: string | null } | null = null;
  let booking: any = null;

  if (token) {
    const { data: c, error: cleanerErr } = await supabaseAdmin
      .from("cleaners")
      .select("id, first_name, phone")
      .eq("portal_token", token)
      .single();

    if (cleanerErr || !c) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    cleaner = c;

    // Either cleaner on a 2-person job may advance it.
    const { data: b, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("*, customers(*)")
      .eq("id", bookingId)
      .or(`assigned_cleaner_id.eq.${c.id},second_cleaner_id.eq.${c.id}`)
      .single();

    if (bookingErr || !b) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    booking = b;
  } else if (isAdmin) {
    const { data: b, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("*, customers(*)")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !b) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
    }
    booking = b;

    // The assigned cleaner may have no cleaners row (outside cover). That is
    // fine — sendSms takes a null cleanerId.
    if (b.assigned_cleaner_id) {
      const { data: c } = await supabaseAdmin
        .from("cleaners")
        .select("id, first_name, phone")
        .eq("id", b.assigned_cleaner_id)
        .single();
      cleaner = c ?? null;
    }
  } else {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const customer = booking.customers as any;
  const now = new Date().toISOString();

  // ── Order + date guards ────────────────────────────────────────────
  // The portal lists every job a cleaner has, so a mis-tap on the wrong card
  // is one thumb away. On 2026-09-11 a "Mark complete" on a job two days out
  // charged a live card $350 and texted the customer a review link. Enforce
  // the tap order here, not just in the UI, and never start or complete a
  // job before its service date. Dates compare in New York time — the
  // server runs in UTC, where "today" flips at 8pm ET.
  const todayNy = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const isFuture = booking.service_date > todayNy;
  const refuse = (error: string) => NextResponse.json({ ok: false, error }, { status: 409 });

  if (event === "on_the_way" && isFuture) {
    return refuse(`This job is on ${booking.service_date} — it can't be started yet.`);
  }
  if (event === "arrived" && !booking.on_the_way_at) {
    return refuse(`Tap "On the way" first.`);
  }
  if (event === "completed" && (!booking.on_the_way_at || !booking.arrived_at)) {
    return refuse(`Tap "On the way" and "Arrived" before marking the job complete.`);
  }
  if (event === "completed" && isFuture) {
    return refuse(`This job is on ${booking.service_date} — it can't be completed yet.`);
  }

  if (event === "on_the_way") {
    await supabaseAdmin.from("bookings").update({ on_the_way_at: now }).eq("id", bookingId);
    await sendSms({
      to: customer.phone,
      body: `Hi ${customer.first_name} — your Manhattan Mint cleaner is on the way.`,
      cleanerId: cleaner?.id ?? null,
      bookingId,
      recipientType: "customer",
      eventType: "on_the_way",
    });
    await supabaseAdmin.from("bookings").update({ on_the_way_sms_sent_at: now }).eq("id", bookingId);
  } else if (event === "arrived") {
    await supabaseAdmin
      .from("bookings")
      .update({ arrived_at: now, status: "in_progress" })
      .eq("id", bookingId);
    await sendSms({
      to: customer.phone,
      body: `Your cleaner has arrived. We'll text again when the clean is complete.`,
      cleanerId: cleaner?.id ?? null,
      bookingId,
      recipientType: "customer",
      eventType: "arrived",
    });
    await supabaseAdmin.from("bookings").update({ arrival_sms_sent_at: now }).eq("id", bookingId);
  } else if (event === "completed") {
    // Idempotency: a second "Job Complete" tap must not re-charge the card
    // or re-send the follow-up texts.
    if (booking.completed_at) {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    await supabaseAdmin
      .from("bookings")
      .update({ completed_at: now, status: "completed" })
      .eq("id", bookingId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";

    // ── Auto-charge the saved card ─────────────────────────────────────
    // Phase 2 goal: owner never charges a card manually. Failure never
    // blocks the rest of the flow — the owner is told to collect manually.
    let chargeLine = "";
    const stripeCustomerId = booking.stripe_customer_id || customer.stripe_customer_id;
    if (booking.stripe_charge_id) {
      chargeLine = `Payment: already charged earlier.`;
    } else if (!stripeCustomerId) {
      chargeLine = `⚠️ Payment: NO CARD ON FILE — collect $${booking.pricing_total} manually.`;
    } else if (!booking.pricing_total || booking.pricing_total <= 0) {
      chargeLine = `Payment: $0 booking, nothing to charge.`;
    } else {
      const charge = await chargeCustomer({
        stripeCustomerId,
        amount: booking.pricing_total,
        description: `Manhattan Mint clean — ${booking.service_date} (${booking.service_summary || booking.frequency})`,
      });
      if (charge.ok) {
        await supabaseAdmin
          .from("bookings")
          .update({ stripe_charge_id: charge.paymentIntentId })
          .eq("id", bookingId);
        chargeLine = `💳 Card charged $${charge.amount} automatically (${charge.status}).`;
      } else {
        chargeLine = `⚠️ AUTO-CHARGE FAILED ($${booking.pricing_total}): ${charge.error} — collect manually via /api/bookings/charge.`;
      }
    }

    // ── Auto-create the next recurring booking ─────────────────────────
    // Recurring customers should never need a manual booking created.
    let recurringLine = "";
    const nextDate = nextServiceDate(booking.service_date, booking.frequency, booking.cleaning_notes);
    if (nextDate) {
      // Dedupe: skip if this customer already has a future booking on the books
      const { data: future } = await supabaseAdmin
        .from("bookings")
        .select("id, service_date")
        .eq("customer_id", booking.customer_id)
        .in("status", ["pending", "confirmed"])
        .gt("service_date", booking.service_date)
        .limit(1);
      if (future?.length) {
        recurringLine = `Next recurring visit already booked (${future[0].service_date}).`;
      } else {
        const nextTotal = booking.pricing_next_clean_total ?? booking.pricing_total;
        const { error: createErr } = await supabaseAdmin.from("bookings").insert({
          customer_id: booking.customer_id,
          status: "pending",
          frequency: booking.frequency,
          bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms,
          service_summary: booking.service_summary,
          service_date: nextDate,
          preferred_time_ranges: booking.preferred_time_ranges ?? [],
          selected_extras: booking.selected_extras ?? [],
          cleaning_notes: booking.cleaning_notes,
          pricing_total: nextTotal,
          pricing_subtotal: booking.pricing_subtotal,
          pricing_next_clean_total: booking.pricing_next_clean_total,
          stripe_payment_method_id: booking.stripe_payment_method_id,
          stripe_customer_id: stripeCustomerId,
        });
        recurringLine = createErr
          ? `⚠️ Failed to auto-create next ${booking.frequency} booking: ${createErr.message}`
          : `🔁 Next ${booking.frequency} visit auto-created for ${nextDate} (pending — assign a cleaner in dispatch).`;
      }
    }

    // Post-clean sequence: review ask, then recurring upsell + referral.
    // Sent as two texts — a single message with every ask buries the review link.
    await sendSms({
      to: customer.phone,
      body: `Hi ${customer.first_name} — your Manhattan Mint clean is complete! 💚 How did we do? It takes 30 seconds and means the world to our team: ${siteUrl}/feedback/${bookingId}`,
      cleanerId: cleaner?.id ?? null,
      bookingId,
      recipientType: "customer",
      eventType: "completed",
    });
    await sendSms({
      to: customer.phone,
      body: `Loved the clean? Lock it in — reply WEEKLY, BIWEEKLY, or MONTHLY and save up to 30% on every clean. Same great cleaner, zero rebooking. Plus: refer a friend and you BOTH get $25 off your next clean. — Manhattan Mint NYC`,
      cleanerId: cleaner?.id ?? null,
      bookingId,
      recipientType: "customer",
      eventType: "other",
    });
    await supabaseAdmin.from("bookings").update({ complete_sms_sent_at: now }).eq("id", bookingId);

    // Alert the owner that the job is done and the follow-ups went out.
    const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    for (const phone of ownerPhones) {
      await sendSms({
        to: phone,
        body: `✅ JOB DONE: ${cleaner?.first_name ?? "A cleaner"} completed ${customer.first_name} ${customer.last_name || ""}'s clean (${booking.service_date}). ${chargeLine}${recurringLine ? ` ${recurringLine}` : ""} Customer texted review link + recurring/referral offers.`,
        cleanerId: cleaner?.id ?? null,
        bookingId,
        recipientType: "customer",
        eventType: "other",
      });
    }
  } else {
    return NextResponse.json({ ok: false, error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
