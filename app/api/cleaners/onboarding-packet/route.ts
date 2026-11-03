import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendOnboardingPacket } from "@/lib/onboarding-packet";

// Send (or resend) a cleaner's onboarding packet on demand (2026-11-03):
// Stripe Connect link + Certn invite + e-sign agreement link, by email and
// text. Admin cookie (the button on /admin/onboarding) or x-cron-secret
// (scripts). `{ cleanerId, dryRun?: true }` — a dry run builds everything,
// creates nothing and sends nothing.
export const maxDuration = 30;

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("mm_admin")?.value;
  const cronSecret = req.headers.get("x-cron-secret");
  const isAdmin = !!process.env.ADMIN_PASSWORD && adminCookie === process.env.ADMIN_PASSWORD;
  const isCron = !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;
  if (!isAdmin && !isCron) return NextResponse.json({ ok: false }, { status: 401 });

  const { cleanerId, dryRun } = await req.json().catch(() => ({}));
  if (!cleanerId || typeof cleanerId !== "string") {
    return NextResponse.json({ ok: false, error: "cleanerId is required" }, { status: 400 });
  }
  try {
    const result = await sendOnboardingPacket({ cleanerId, dryRun: !!dryRun });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[cleaners/onboarding-packet]", cleanerId, message);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
