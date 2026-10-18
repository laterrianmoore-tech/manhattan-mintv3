// Seasonal first-clean promos, one place for code, amount and dates.
//
// Each promo is a flat dollar amount off a first clean, valid for bookings
// placed between `start` and `end` inclusive (dates compared as YYYY-MM-DD in
// UTC, matching the rest of the booking code). The popup, the welcome email,
// the promo bar, the quote page and the booking API all read from here, so a
// new season is one entry below plus its copy in EmailCaptureModal.
//
// History: FALL50 (fall 2026) → INLAWS "Guest Room Emergency" (holiday 2026).

export type SeasonalPromo = {
  code: string;
  amount: number;
  start: string; // first day the code works
  end: string; // last day the code works
  name: string; // shown as the offer name in the welcome email
  endLabel: string; // "October 31" — human form of `end`
};

export const SEASONAL_PROMOS: SeasonalPromo[] = [
  { code: "FALL50", amount: 50, start: "2026-09-01", end: "2026-10-31", name: "Fall reset offer", endLabel: "October 31" },
  { code: "INLAWS", amount: 50, start: "2026-11-01", end: "2026-12-23", name: "Guest Room Emergency", endLabel: "December 23" },
];

export function todayISO(now: Date = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** The promo running today, or null between seasons. */
export function activePromo(today: string = todayISO()): SeasonalPromo | null {
  return SEASONAL_PROMOS.find((p) => today >= p.start && today <= p.end) ?? null;
}

export function promoByCode(code: string): SeasonalPromo | null {
  const c = code.trim().toUpperCase();
  return SEASONAL_PROMOS.find((p) => p.code === c) ?? null;
}

export function isSeasonalPromoCode(code: string) {
  return promoByCode(code) !== null;
}

/** Whether a seasonal code can be used today: "active", "expired", "upcoming" or "unknown". */
export function promoStatus(code: string, today: string = todayISO()) {
  const p = promoByCode(code);
  if (!p) return "unknown" as const;
  if (today < p.start) return "upcoming" as const;
  if (today > p.end) return "expired" as const;
  return "active" as const;
}

export function daysLeft(p: SeasonalPromo, now: Date = new Date()) {
  return Math.max(0, Math.ceil((new Date(`${p.end}T23:59:59`).getTime() - now.getTime()) / 86400000));
}
