import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
    .select("id, assigned_cleaner_id")
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
    console.error("[feedback] insert error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
