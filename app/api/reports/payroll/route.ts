import { NextResponse } from "next/server";
import { sendSms } from "@/lib/openphone";
import { buildPayrollReport, formatPayrollSms } from "@/lib/payroll-report";

// Thursday payroll text to the owner: who to pay and how much. Fired by the
// Netlify scheduled function netlify/functions/thursday-payroll.mjs with the
// cron secret. `?dryRun=1` returns the numbers and the text without sending.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const dryRun = url.searchParams.get("dryRun") === "1";

  const report = await buildPayrollReport();
  const text = formatPayrollSms(report);
  if (dryRun) return NextResponse.json({ ok: true, dryRun: true, report, text });

  const phones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
  const results = [];
  for (const to of phones) {
    const r = await sendSms({ to, body: text, bookingId: null, cleanerId: null, recipientType: "customer", eventType: "other" });
    results.push({ to: to.slice(-4), ok: r.ok, error: r.errorMessage ?? null });
  }
  console.log("[reports/payroll]", JSON.stringify({ total: report.total, results }));
  return NextResponse.json({ ok: true, report, results });
}
