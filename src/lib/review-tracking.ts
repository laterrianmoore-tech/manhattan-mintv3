import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabase";
import { GOOGLE_REVIEWS_URL } from "./google-reviews";

// Review-link tracking (2026-09-18).
//
// Each first-time booking gets a per-booking review_token. The customer is
// sent https://manhattanmintnyc.com/api/r/<token>/, which stamps
// review_link_clicked_at and 302s to Google. The owner can then see who tapped
// and mark who actually reviewed (review_received_at) from /admin/dispatch.
//
// Columns live on bookings — see lib/supabase/migrations/2026-09-18-review-tracking.sql.
// Every write here is TOLERANT of the columns not existing yet: it logs and
// returns null/false so a deploy that lands before the migration can never
// break "Job Complete". Callers fall back to the plain Google URL.

export { GOOGLE_REVIEWS_URL };

export const REVIEW_TOKEN_RE = /^[a-f0-9]{32}$/i;

export function newReviewToken(): string {
  return randomBytes(16).toString("hex");
}

// NEXT_PUBLIC_SITE_URL is localhost in .env.local. A customer-facing link must
// never ship a localhost URL, so anything that isn't https falls back to prod.
export function publicSiteUrl(): string {
  const candidate = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return candidate.startsWith("https://") ? candidate.replace(/\/+$/, "") : "https://manhattanmintnyc.com";
}

// Trailing slash matches next.config.js `trailingSlash: true` so the redirect
// is served directly instead of via a 308 hop.
export function trackedReviewUrl(token: string): string {
  return `${publicSiteUrl()}/api/r/${token}/`;
}

// The URL to hand a customer: tracked when we have a token, plain Google otherwise.
export function reviewUrlFor(token: string | null | undefined): string {
  return token && REVIEW_TOKEN_RE.test(token) ? trackedReviewUrl(token) : GOOGLE_REVIEWS_URL;
}

function isMissingColumn(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  // 42703 = Postgres undefined_column; PGRST204 = PostgREST "column not in schema cache".
  return error.code === "42703" || error.code === "PGRST204" || /column/i.test(error.message ?? "");
}

// Read the booking's token, or null if there is none / the column is missing.
export async function getReviewToken(bookingId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("review_token")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) {
    if (isMissingColumn(error)) {
      console.warn("[review-tracking] review_token column missing — run the 2026-09-18 migration");
    } else {
      console.warn("[review-tracking] token lookup failed:", error.message);
    }
    return null;
  }
  const token = (data as any)?.review_token;
  return typeof token === "string" && REVIEW_TOKEN_RE.test(token) ? token : null;
}

// Return the booking's token, minting one if it has none. Null when the
// column does not exist yet (or the write fails), so the caller uses the
// plain Google link instead.
export async function ensureReviewToken(bookingId: string): Promise<string | null> {
  const existing = await getReviewToken(bookingId);
  if (existing) return existing;

  const token = newReviewToken();
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ review_token: token })
    .eq("id", bookingId)
    .is("review_token", null)
    .select("id");
  if (error) {
    if (isMissingColumn(error)) {
      console.warn("[review-tracking] review_token column missing — sending the plain Google link");
    } else {
      console.warn("[review-tracking] could not store review token:", error.message);
    }
    return null;
  }
  // Another writer minted a token between our read and write; use theirs.
  if (!data?.length) return getReviewToken(bookingId);
  return token;
}

// Stamp one of the review timestamps. Never throws; returns false on failure.
export async function stampReview(
  bookingId: string,
  patch: Partial<
    Record<
      "review_link_sent_at" | "review_link_clicked_at" | "review_nudge_sent_at" | "review_received_at",
      string | null
    >
  >,
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("bookings").update(patch).eq("id", bookingId);
  if (error) {
    console.warn(
      `[review-tracking] could not stamp ${Object.keys(patch).join(",")} on ${bookingId}:`,
      error.message,
    );
    return false;
  }
  return true;
}

// Record the first tap on a tracked link. Returns the booking id when the
// token matched, null otherwise. Later taps leave the first timestamp alone.
export async function recordReviewClick(token: string): Promise<string | null> {
  if (!REVIEW_TOKEN_RE.test(token)) return null;
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, review_link_clicked_at")
    .eq("review_token", token)
    .maybeSingle();
  if (error) {
    console.warn("[review-tracking] click lookup failed:", error.message);
    return null;
  }
  if (!data) return null;
  if (!(data as any).review_link_clicked_at) {
    await stampReview((data as any).id, { review_link_clicked_at: new Date().toISOString() });
  }
  return (data as any).id;
}
