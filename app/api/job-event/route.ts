import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";
import { chargeCustomer } from "@/lib/stripe-charge";

// Next service date for a recurring frequency, from the just-completed date.
function nextServiceDate(serviceDate: string, frequency: string): string | null {
  const d = new Date(serviceDate + "T12:00:00");
  if (frequency === "Weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "Bi-Weekly") d.setDate(d.getDate() + 14);
  else if (frequency === "Monthly") d.setMonth(d.getMonth() + 1);
  else return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const { token, bookingId, event } = await req.json();

  if (!token || !bookingId || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: cleaner, error: cleanerErr } = await supabaseAdmin
    .from("cleaners")
    .select("id, first_name, phone")
    .eq("portal_token", token)
    .single();

  if (cleanerErr || !cleaner) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("*, customers(*)")
    .eq("id", bookingId)
    .eq("assigned_cleaner_id", cleaner.id)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const customer = booking.customers as any;
  const now = new Date().toISOString();

  if (event === "on_the_way") {
    await supabaseAdmin.from("bookings").update({ on_the_way_at: now }).eq("id", bookingId);
    await sendSms({
      to: customer.phone,
      body: `Hi ${customer.first_name} — your Manhattan Mint cleaner is on the way.`,
      cleanerId: cleaner.id,
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
      cleanerId: cleaner.id,
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
    const nextDate = nextServiceDate(booking.service_date, booking.frequency);
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
      cleanerId: cleaner.id,
      bookingId,
      recipientType: "customer",
      eventType: "completed",
    });
    await sendSms({
      to: customer.phone,
      body: `Loved the clean? Lock it in — reply WEEKLY, BIWEEKLY, or MONTHLY and save up to 30% on every clean. Same great cleaner, zero rebooking. Plus: refer a friend and you BOTH get $25 off your next clean. — Manhattan Mint NYC`,
      cleanerId: cleaner.id,
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
        body: `✅ JOB DONE: ${cleaner.first_name} completed ${customer.first_name} ${customer.last_name || ""}'s clean (${booking.service_date}). ${chargeLine}${recurringLine ? ` ${recurringLine}` : ""} Customer texted review link + recurring/referral offers.`,
        cleanerId: cleaner.id,
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
