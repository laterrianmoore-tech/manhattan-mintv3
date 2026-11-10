import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/openphone";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, rating, wouldBookAgain, heardAboutUs, comment } = body;

  // Validate rating
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "rating must be 1–5" }, { status: 400 });
  }

  // Validate comment length
  if (comment && comment.length > 500) {
    return NextResponse.json({ ok: false, error: "Comment must be 500 chars or fewer" }, { status: 400 });
  }

  // Look up booking for assigned_cleaner_id and existence check
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("id, assigned_cleaner_id, service_date, customers(first_name, last_name)")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  // "How did you hear about us?" is stored inside the comment column
  // (prefixed marker) to avoid a schema change.
  const heardTag =
    typeof heardAboutUs === "string" && heardAboutUs.trim() && heardAboutUs.length <= 60
      ? `[Heard about us: ${heardAboutUs.trim()}]`
      : "";
  const combinedComment = [heardTag, comment?.trim() || ""].filter(Boolean).join("\n") || null;

  let saved = true;
  const { error } = await supabaseAdmin.from("feedback").insert({
    booking_id: bookingId,
    cleaner_id: booking.assigned_cleaner_id ?? null,
    rating,
    would_book_again: wouldBookAgain ?? null,
    comment: combinedComment,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Feedback already submitted." },
        { status: 409 }
      );
    }
    // The table refused the row (it did for weeks: missing grants). The customer
    // still told us something, so the owner hears about it regardless.
    console.error("[feedback] insert error:", error);
    saved = false;
  }

  // Text the owner every feedback submission the moment it lands (non-fatal).
  const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (ownerPhones.length) {
    const c = (booking as any).customers;
    const name = [c?.first_name, c?.last_name].filter(Boolean).join(" ") || "customer";
    // 3 stars or fewer, or "not sure I'd book again", is a customer to call today.
    const unhappy = rating <= 3 || wouldBookAgain === false;
    const parts = [
      `${unhappy ? "🚨 UNHAPPY CUSTOMER" : "⭐ FEEDBACK"}: ${rating}/5 from ${name} (clean ${(booking as any).service_date})`,
      wouldBookAgain === true ? "Would book again: YES" : wouldBookAgain === false ? "Would book again: not sure" : "",
      heardTag ? heardTag.replace(/^\[|\]$/g, "") : "",
      comment?.trim() ? `"${comment.trim().slice(0, 220)}"` : "",
      unhappy ? "Text or call them today." : "",
      saved ? "" : "(Not saved to the database: paste the pending SQL file in Supabase.)",
    ].filter(Boolean);
    for (const phone of ownerPhones) {
      try {
        await sendSms({
          to: phone,
          body: parts.join(" · "),
          bookingId,
          cleanerId: booking.assigned_cleaner_id ?? null,
          recipientType: "customer",
          eventType: "other",
        });
      } catch (smsErr) {
        console.error("[feedback] owner SMS failed (non-fatal):", smsErr);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
