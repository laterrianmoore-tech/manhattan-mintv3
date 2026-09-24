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

// ── "Second Clean on Us" promo (landing page /second-clean, Google Ads) ──
// Book a first clean with code SECOND by SECOND_PROMO_END; when it completes the
// customer is texted a personal code (FREE + 6 hex of their id) worth one free
// Standard clean of the same apartment, redeemable within SECOND_WINDOW_DAYS.
// Add-ons stay full price. Everything is enforced in app/api/bookings/submit.
export const SECOND_PROMO_CODE = "SECOND";
export const SECOND_PROMO_END = "2026-10-31";
export const SECOND_WINDOW_DAYS = 60;
export const SECOND_CLEAN_CODE_RE = /^FREE[0-9A-F]{6}$/;

export function secondCleanCodeFor(customerId: string): string {
  return "FREE" + customerId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function isSecondCleanCode(code: string | null | undefined): boolean {
  return SECOND_CLEAN_CODE_RE.test((code ?? "").trim().toUpperCase());
}
