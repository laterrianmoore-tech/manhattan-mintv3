import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

// Admin-only (2026-10-08): stamp a batch of jobs as paid out to a cleaner.
// The transfer itself still happens in the Stripe dashboard (or Zelle); this
// records that it did, so the payout list on /admin/accounting empties and
// the ledger shows the money as gone. `ref` is whatever identifies the
// transfer: a Stripe transfer id, "Zelle 10/10", etc.
type Item = { bookingId: string; slot: "primary" | "second" };

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  if (adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { items, ref, undo } = (await req.json()) as { items?: Item[]; ref?: string; undo?: boolean };
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return NextResponse.json({ ok: false, error: "items (1-100) required" }, { status: 400 });
  }
  const payoutRef = typeof ref === "string" && ref.trim() ? ref.trim().slice(0, 120) : null;
  const now = new Date().toISOString();

  let updated = 0;
  const failures: string[] = [];
  for (const it of items) {
    if (!it?.bookingId) continue;
    const second = it.slot === "second";
    const update = second
      ? { second_cleaner_paid_at: undo ? null : now, second_cleaner_payout_ref: undo ? null : payoutRef }
      : { cleaner_paid_at: undo ? null : now, cleaner_payout_ref: undo ? null : payoutRef };
    const { error } = await supabaseAdmin.from("bookings").update(update).eq("id", it.bookingId);
    if (error) failures.push(`${it.bookingId.slice(0, 8)}: ${error.message}`);
    else updated++;
  }

  if (failures.length && updated === 0) {
    return NextResponse.json({ ok: false, error: failures.join("; ") }, { status: 500 });
  }
  return NextResponse.json({ ok: true, updated, failures, paidAt: undo ? null : now });
}
