import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyLockoutToken } from "@/lib/manage-token";
import { isTaxableBooking } from "@/lib/stripe-tax";
import { inspectHold } from "@/lib/stripe-hold";
import { isOpenLockout, loadLockoutBooking, lockoutColumnsPresent, LOCKOUT_FEE_DOLLARS, resolveLockout, type LockoutAction } from "@/lib/lockout";

// Owner resolution of a lockout (2026-10-28). Two ways in: the admin cookie
// from /admin/dispatch, or the signed link (b + t) texted to the owner when
// the cleaner tapped "Can't get in". GET describes the job for the /lockout/
// page; POST applies one of let_in | charge | waive.
//
// ?dryRun=1 (or { dryRun: true }) on POST computes every text and the email
// without writing, charging or sending.

export const dynamic = "force-dynamic";

async function authorized(bookingId: string, token: string | null): Promise<boolean> {
  if (token && verifyLockoutToken(bookingId, token)) return true;
  const cookieStore = await cookies();
  return cookieStore.get("mm_admin")?.value === process.env.ADMIN_PASSWORD;
}

function fmtTime(iso: string | null | undefined): string | null {
  return iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookingId = (url.searchParams.get("b") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  if (!bookingId || !(await authorized(bookingId, token))) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  const loaded = await loadLockoutBooking(bookingId);
  if (!loaded) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  const { booking, cleanerName } = loaded;
  const c = booking.customers;
  const migrated = lockoutColumnsPresent(booking);
  const hold = booking.stripe_charge_id ? await inspectHold(booking.stripe_charge_id) : { state: "none" as const };
  const taxable = migrated && isOpenLockout(booking) ? await isTaxableBooking({ customerId: booking.customer_id, createdAt: booking.created_at }) : false;
  return NextResponse.json({
    ok: true,
    booking: {
      id: booking.id,
      migrated,
      customerName: `${c.first_name} ${c.last_name || ""}`.trim(),
      firstName: c.first_name,
      address: [c.address, c.apt_no ? `Apt ${c.apt_no}` : ""].filter(Boolean).join(" "),
      phone: c.phone ?? null,
      email: c.email ?? null,
      serviceDate: booking.service_date,
      dateLabel: new Date(`${booking.service_date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      cleanerName,
      status: booking.status,
      price: booking.pricing_total ?? 0,
      lockedOutAt: booking.locked_out_at ?? null,
      lockedOutLabel: fmtTime(booking.locked_out_at),
      resolvedAt: booking.lockout_resolved_at ?? null,
      resolvedLabel: fmtTime(booking.lockout_resolved_at),
      resolution: booking.lockout_resolution ?? null,
      feeCents: booking.lockout_fee_cents ?? null,
      open: migrated && isOpenLockout(booking),
      hold: hold.state === "held" ? { amount: hold.amount } : hold.state === "captured" ? { captured: hold.amount } : null,
      hasCard: !!(booking.stripe_customer_id || c.stripe_customer_id),
      fee: LOCKOUT_FEE_DOLLARS,
      taxable,
    },
  });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const bookingId = String(body?.bookingId || body?.b || "").trim();
  const token = String(body?.token || body?.t || "").trim() || null;
  const action = String(body?.action || "") as LockoutAction;
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1" || body?.dryRun === true;
  if (!bookingId || !["let_in", "charge", "waive"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Missing bookingId or action (let_in | charge | waive)." }, { status: 400 });
  }
  if (!(await authorized(bookingId, token))) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  const result = await resolveLockout({ bookingId, action, dryRun });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
