import { createHmac, timingSafeEqual } from "crypto";

// Self-serve booking links ("move or skip this visit") are signed with an HMAC
// of the booking id, keyed by CRON_SECRET, the same pattern as unsubscribe
// links. No DB column, and a link for one booking can't be turned into another.

function secret(): string {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error("CRON_SECRET not set — required for manage-booking tokens");
  return s;
}

export function manageToken(bookingId: string): string {
  return createHmac("sha256", secret()).update(`manage:${bookingId.trim()}`).digest("hex").slice(0, 32);
}

export function verifyManageToken(bookingId: string, token: string): boolean {
  if (!bookingId || !token) return false;
  const expected = manageToken(bookingId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function manageUrl(bookingId: string, siteUrl: string): string {
  const params = new URLSearchParams({ b: bookingId, t: manageToken(bookingId) });
  return `${siteUrl.replace(/\/$/, "")}/manage/?${params.toString()}`;
}
