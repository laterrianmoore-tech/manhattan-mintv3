// Personal referral ("friend") codes.
//
// Deterministic from the customer's UUID so nothing has to be stored or
// migrated: MINT + the first six hex characters, upper-cased (e.g. MINT39FDA5).
// A friend books with the code and gets $50 off their first clean; once that
// clean completes, the referrer gets $50 off their next one
// (scripts/apply-referral-credits.mjs applies it). Both amounts live here.
export const REFERRAL_FRIEND_DISCOUNT = 50;
export const REFERRAL_REFERRER_CREDIT = 50;
export const REFERRAL_CODE_RE = /^MINT[0-9A-F]{6}$/;

export function referralCodeFor(customerId: string): string {
  return "MINT" + customerId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function isReferralCode(code: string | null | undefined): boolean {
  return REFERRAL_CODE_RE.test((code ?? "").trim().toUpperCase());
}

// Customer-facing links must never carry a localhost SITE_URL (it has happened).
export function publicSiteUrl(candidate?: string | null): string {
  return candidate && /^https:\/\//.test(candidate) ? candidate.replace(/\/$/, "") : "https://manhattanmintnyc.com";
}

export function referralLink(code: string, siteUrl?: string | null): string {
  return `${publicSiteUrl(siteUrl)}/quote/?code=${code}`;
}
