// Broker code shape, with no server imports so the quote page (a client
// component) can use it. The database side is src/lib/brokers.ts.
//
// Upper-case letters and digits, 3-12 long, and never shaped like one of the
// per-customer codes (MINT…, FREE…). Checked before any database lookup so a
// random coupon typo doesn't cost a query.
export const BROKER_CODE_RE = /^(?!MINT|FREE)[A-Z][A-Z0-9]{2,11}$/;

export function normalizeBrokerCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

export function looksLikeBrokerCode(code: string | null | undefined): boolean {
  return BROKER_CODE_RE.test(normalizeBrokerCode(code));
}
