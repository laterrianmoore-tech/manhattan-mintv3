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

// Customer account links (2026-10-09): the same idea per customer instead of
// per booking. No password, no login: the link in their texts is the key.
export function accountToken(customerId: string): string {
  return createHmac("sha256", secret()).update(`account:${customerId.trim()}`).digest("hex").slice(0, 32);
}

export function verifyAccountToken(customerId: string, token: string): boolean {
  if (!customerId || !token) return false;
  const expected = accountToken(customerId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function accountUrl(customerId: string, siteUrl: string): string {
  const params = new URLSearchParams({ c: customerId, t: accountToken(customerId) });
  return `${siteUrl.replace(/\/$/, "")}/account/?${params.toString()}`;
}
