import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { DAY_KEYS } from "@/lib/availability";

// Admin-only: the days a cleaner usually works (2026-11-02). Toggled from the
// week board on /admin/dispatch and stored in cleaners.available_days as
// ['mon','wed','fri']. An empty list means "not set" — any day. Nothing is
// texted; this is the owner's own note on the roster.
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { cleanerId, days } = await req.json().catch(() => ({}));
  if (!cleanerId || typeof cleanerId !== "string" || !Array.isArray(days)) {
    return NextResponse.json({ ok: false, error: "cleanerId and days are required" }, { status: 400 });
  }
  const clean = Array.from(new Set(days.map((d) => String(d).toLowerCase()))).filter((d): d is (typeof DAY_KEYS)[number] =>
    (DAY_KEYS as readonly string[]).includes(d),
  );
  if (clean.length !== days.length) {
    return NextResponse.json({ ok: false, error: "days must be mon..sun" }, { status: 400 });
  }
  // Keep them in week order so the column reads naturally in Supabase.
  const ordered = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].filter((d) => clean.includes(d as any));

  const { error } = await supabaseAdmin
    .from("cleaners")
    .update({ available_days: ordered.length ? ordered : null } as any)
    .eq("id", cleanerId);

  if (error) {
    if (/available_days/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: "Usual days aren't set up in the database yet — run lib/supabase/migrations/2026-11-02-cleaner-available-days.sql in Supabase." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, days: ordered });
}
