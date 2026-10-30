import { NextResponse } from "next/server";
import { verifyPartnerToken } from "@/lib/manage-token";
import { brokerStatsFor, getBrokerPartner } from "@/lib/brokers";

// Broker tracking page data (2026-10-30). The signed link
// /partners/<CODE>/?t=<hmac> fetches /api/partners/?code=<CODE>&t=<hmac>.
// Returns clicks, bookings, completed cleans, recurring conversions, fees
// earned / paid / owed and the job list. Nothing about what the client paid,
// only the broker's fee per job.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  const token = (url.searchParams.get("t") || "").trim();
  if (!verifyPartnerToken(code, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  const partner = await getBrokerPartner(code);
  if (!partner) return NextResponse.json({ ok: false, error: "We couldn't find that partner." }, { status: 404 });

  const stats = await brokerStatsFor(partner);
  return NextResponse.json({
    ok: true,
    stats: {
      code: partner.code,
      name: partner.name,
      contactName: partner.contactName,
      feePerJob: partner.feePerJob,
      feeRecurring: partner.feeRecurring,
      clicks: stats.clicks,
      bookings: stats.bookings,
      completed: stats.completed,
      newClients: stats.newClients,
      recurringConversions: stats.recurringConversions,
      feesEarned: stats.feesEarned,
      feesPaid: stats.feesPaid,
      feesOwed: stats.feesOwed,
      dbReady: stats.dbReady,
      jobs: stats.jobs.map((j) => ({
        id: j.bookingId,
        date: j.date,
        client: j.client,
        apartment: j.apartment,
        status: j.status,
        statusLabel: j.statusLabel,
        recurring: j.recurring,
        fee: j.fee,
        firstClean: j.firstClean,
        recurringBonus: j.recurringBonus,
        paidAt: j.feePaidAt,
      })),
    },
  });
}
