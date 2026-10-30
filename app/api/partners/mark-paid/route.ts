import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { brokerFeesOwed, normalizeBrokerCode } from "@/lib/brokers";

// Admin-only (2026-10-30): after the Friday Zelle/Venmo to a broker, stamp
// every fee that was owed to them as paid. Body: { code, ref?, undo?, bookingIds? }.
// With no bookingIds, every currently-owed job for that partner is stamped
// (the number the Thursday text and /admin/partners showed). `ref` is
// "Zelle 11/6" or similar.

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("mm_admin")?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string; ref?: string; undo?: boolean; bookingIds?: string[] };
  const code = normalizeBrokerCode(body.code);
  if (!code) return NextResponse.json({ ok: false, error: "code required" }, { status: 400 });
  const ref = typeof body.ref === "string" && body.ref.trim() ? body.ref.trim().slice(0, 120) : null;

  let ids: string[];
  if (Array.isArray(body.bookingIds) && body.bookingIds.length) {
    ids = body.bookingIds.filter((x) => typeof x === "string").slice(0, 200);
  } else {
    const { payouts, error } = await brokerFeesOwed();
    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
    ids = payouts.find((p) => p.code === code)?.jobs.map((j) => j.bookingId) ?? [];
  }
  if (!ids.length) return NextResponse.json({ ok: true, updated: 0 });

  const now = new Date().toISOString();
  const { error, count } = await supabaseAdmin
    .from("bookings")
    .update({ broker_fee_paid_at: body.undo ? null : now, broker_fee_ref: body.undo ? null : ref }, { count: "exact" })
    .in("id", ids);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: count ?? ids.length, paidAt: body.undo ? null : now });
}
