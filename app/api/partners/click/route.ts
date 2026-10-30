import { NextResponse } from "next/server";
import { getBrokerPartner, logBrokerClick, looksLikeBrokerCode } from "@/lib/brokers";

// Broker link click (2026-10-30). The quote page posts here when it loads with
// a broker code (/quote/?code=OSUR). Resolves the code to a partner so the
// page can show "Referred by The Osur Team", and logs the visit for the
// broker's tracking page. Unknown codes answer { ok: true, partner: null }
// so the page simply shows nothing. Body: { code, referrer?, log? }.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { code?: string; referrer?: string; log?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* fall through */
  }
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!looksLikeBrokerCode(code)) return NextResponse.json({ ok: true, partner: null });
  const partner = await getBrokerPartner(code);
  if (!partner) return NextResponse.json({ ok: true, partner: null });
  if (body.log !== false) {
    await logBrokerClick(partner.code, { referrer: body.referrer ?? req.headers.get("referer"), userAgent: req.headers.get("user-agent") });
  }
  return NextResponse.json({ ok: true, partner: { code: partner.code, name: partner.name } });
}
