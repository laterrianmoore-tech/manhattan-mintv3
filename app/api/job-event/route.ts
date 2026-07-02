import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

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
    await supabaseAdmin
      .from("bookings")
      .update({ completed_at: now, status: "completed" })
      .eq("id", bookingId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manhattanmintnyc.com";

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
        body: `✅ JOB DONE: ${cleaner.first_name} completed ${customer.first_name} ${customer.last_name || ""}'s clean (${booking.service_date}). Customer texted: review link + recurring offer (up to 30% off) + $25 referral. Watch OpenPhone for their reply. Reminder: collect payment.`,
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
