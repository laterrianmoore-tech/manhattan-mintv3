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

// Stripe Connect onboarding links (2026-10-18): a durable, textable URL per
// Connect account. Stripe's own account links expire in minutes, so
// /api/connect/onboard?a=acct_…&t=… mints a fresh one on every visit.
export function connectToken(accountId: string): string {
  return createHmac("sha256", secret()).update(`connect:${accountId.trim()}`).digest("hex").slice(0, 32);
}

export function verifyConnectToken(accountId: string, token: string): boolean {
  if (!accountId || !token) return false;
  const expected = connectToken(accountId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function connectOnboardUrl(accountId: string, siteUrl: string): string {
  const params = new URLSearchParams({ a: accountId, t: connectToken(accountId) });
  // Trailing slash: next.config has trailingSlash on, and the bare path 308s.
  return `${siteUrl.replace(/\/$/, "")}/api/connect/onboard/?${params.toString()}`;
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

// Card-on-file links (2026-10-21): a short, durable "save your card" URL per
// Stripe customer. Stripe's setup-mode Checkout URLs are ~400 characters and
// expire after 24h, which reads badly in a text and goes dead before a slow
// customer gets to it. /card/?c=cus_…&t=<hmac> mints a fresh Checkout session
// on every visit and, on the way back, stamps the new card onto the
// customer's open bookings (there is no Stripe webhook).
export function cardToken(stripeCustomerId: string): string {
  return createHmac("sha256", secret()).update(`card:${stripeCustomerId.trim()}`).digest("hex").slice(0, 16);
}

export function verifyCardToken(stripeCustomerId: string, token: string): boolean {
  if (!stripeCustomerId || !token) return false;
  const expected = cardToken(stripeCustomerId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function cardUrl(stripeCustomerId: string, siteUrl: string): string {
  const params = new URLSearchParams({ c: stripeCustomerId, t: cardToken(stripeCustomerId) });
  // Trailing slash: next.config has trailingSlash on, and the bare path 308s.
  return `${siteUrl.replace(/\/$/, "")}/card/?${params.toString()}`;
}

// Broker partner tracking links (2026-10-30): /partners/<CODE>/?t=<hmac> is
// the private page a referring broker (The Osur Team, code OSUR) opens to see
// clicks, bookings, completed cleans and fees. Same no-login idea as the
// customer account link; the code is public, the token is not.
export function partnerToken(code: string): string {
  return createHmac("sha256", secret()).update(`partner:${code.trim().toUpperCase()}`).digest("hex").slice(0, 32);
}

export function verifyPartnerToken(code: string, token: string): boolean {
  if (!code || !token) return false;
  const expected = partnerToken(code);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function partnerUrl(code: string, siteUrl: string): string {
  const params = new URLSearchParams({ t: partnerToken(code) });
  return `${siteUrl.replace(/\/$/, "")}/partners/${encodeURIComponent(code.trim().toUpperCase())}/?${params.toString()}`;
}
