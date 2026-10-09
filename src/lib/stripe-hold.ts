import Stripe from "stripe";

// Authorization holds on the customer's saved card.
//
// Why: a saved card only proves the card exists, not that it has money. On
// 2026-10-02 a clean finished and the auto-charge bounced (insufficient funds),
// leaving the owner to chase an invoice. A hold placed at booking time reserves
// the full amount up front, so a card with no funds fails at checkout instead
// of after the work is done. The hold is captured when the cleaner taps
// "Job Complete" and released if the job is cancelled.
//
// Storage: bookings.stripe_charge_id carries the PaymentIntent id from the
// moment the hold is placed. The same id becomes the charge on capture, so no
// extra column is needed — Stripe is the source of truth for whether it is
// still a hold (requires_capture), captured (succeeded) or gone (canceled).
//
// Card holds expire after 7 days. The day-before reminder job refreshes any
// hold older than HOLD_REFRESH_AFTER_DAYS and places one on bookings that
// never had it (hand-created, recurring auto-created, card added later).

export const HOLD_REFRESH_AFTER_DAYS = 5;

const API_VERSION = "2026-02-25.clover" as const;

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: API_VERSION }) : null;
}

export type HoldResult =
  | { ok: true; paymentIntentId: string; amount: number; status: string }
  | { ok: false; declined: boolean; code?: string; error: string };

// Friendly wording for the customer when the hold is declined. Stripe's own
// messages are fine but mention "purchase", which this is not.
export function declineMessage(code?: string, declineCode?: string): string {
  const key = declineCode || code || "";
  if (key === "insufficient_funds") {
    return "Your card was declined for insufficient funds. Please use a different card — we only place a hold now and charge after your clean.";
  }
  if (key === "expired_card") return "That card has expired. Please use a different card.";
  if (key === "incorrect_cvc" || key === "invalid_cvc") return "The security code (CVC) didn't match. Please check it and try again.";
  if (key === "incorrect_number" || key === "invalid_number") return "That card number doesn't look right. Please check it and try again.";
  if (key === "lost_card" || key === "stolen_card" || key === "pickup_card") return "Your bank declined this card. Please use a different card.";
  return "Your card was declined. Please try a different card — we only place a hold now and charge after your clean.";
}

// True when the failure is the card's fault (declined, expired, bad CVC…)
// rather than ours (network, config, Stripe outage). Card faults should bounce
// the booking; our faults should let it through without a hold.
export function isCardDecline(err: unknown): boolean {
  const e = err as Stripe.errors.StripeError | undefined;
  if (!e) return false;
  if (e.type === "StripeCardError") return true;
  const code = (e as Stripe.errors.StripeError).code;
  return code === "card_declined" || code === "expired_card" || code === "incorrect_cvc" || code === "incorrect_number";
}

// Customers on a Stripe Subscription (Katherine, $149/month since 2026-09-29)
// are billed by the subscription, never per clean. No hold, no capture.
export async function hasActiveSubscription(stripeCustomerId: string): Promise<boolean> {
  const stripe = client();
  if (!stripe || !stripeCustomerId) return false;
  try {
    const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "all", limit: 5 });
    return subs.data.some((s) => ["active", "trialing", "past_due"].includes(s.status));
  } catch (err) {
    console.error("[stripe-hold] subscription lookup failed", err);
    return false;
  }
}

// Pick the card to hold against: the explicit one, else the customer default,
// else the newest attached card (cards saved via the setup link never become
// the default).
async function resolvePaymentMethod(stripe: Stripe, customerId: string, preferred?: string | null): Promise<string | null> {
  if (preferred) return preferred;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const def = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
  if (def) return typeof def === "string" ? def : def.id;
  const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
  return pms.data[0]?.id ?? null;
}

// Places an uncaptured PaymentIntent for the booking total. The customer sees
// a pending charge; nothing moves until captureHold().
export async function placeHold(opts: {
  stripeCustomerId: string;
  paymentMethodId?: string | null;
  amount: number; // dollars, tax included when the booking is taxable
  description: string;
  bookingId?: string | null;
  /** Extra PaymentIntent metadata (tax_cents etc.). */
  metadata?: Record<string, string>;
}): Promise<HoldResult> {
  const stripe = client();
  if (!stripe) return { ok: false, declined: false, error: "Missing STRIPE_SECRET_KEY" };
  if (!opts.stripeCustomerId || !opts.amount || opts.amount <= 0) {
    return { ok: false, declined: false, error: "stripeCustomerId and a positive amount are required" };
  }
  try {
    const pm = await resolvePaymentMethod(stripe, opts.stripeCustomerId, opts.paymentMethodId);
    if (!pm) return { ok: false, declined: false, code: "no_payment_method", error: "No payment method on file for this customer" };
    // No idempotency key on purpose: a released hold re-placed the same day
    // would otherwise get the cancelled PaymentIntent back. Callers inspect
    // the stored hold before placing a new one.
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(opts.amount * 100),
      currency: "usd",
      customer: opts.stripeCustomerId,
      payment_method: pm,
      payment_method_types: ["card"],
      capture_method: "manual",
      off_session: true,
      confirm: true,
      description: opts.description,
      metadata: {
        kind: "booking_hold",
        ...(opts.bookingId ? { supabase_booking_id: opts.bookingId } : {}),
        ...(opts.metadata ?? {}),
      },
    });
    if (pi.status !== "requires_capture") {
      return { ok: false, declined: false, code: pi.status, error: `Hold ended in status ${pi.status}` };
    }
    return { ok: true, paymentIntentId: pi.id, amount: pi.amount / 100, status: pi.status };
  } catch (err: unknown) {
    const e = err as Stripe.errors.StripeError & { decline_code?: string };
    console.error("[stripe-hold] place failed", e?.code, e?.decline_code, e?.message);
    const declined = isCardDecline(e);
    return {
      ok: false,
      declined,
      code: e?.decline_code || e?.code,
      error: declined ? declineMessage(e?.code, e?.decline_code) : e?.message || "Hold failed",
    };
  }
}

export type HoldState =
  | { state: "held"; paymentIntentId: string; amount: number; createdAt: Date; ageDays: number }
  | { state: "captured"; paymentIntentId: string; amount: number }
  | { state: "gone"; paymentIntentId: string; status: string }
  | { state: "none" };

// What the stored PaymentIntent currently is, from Stripe's point of view.
export async function inspectHold(paymentIntentId: string | null | undefined): Promise<HoldState> {
  const stripe = client();
  if (!stripe || !paymentIntentId || !paymentIntentId.startsWith("pi_")) return { state: "none" };
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status === "requires_capture") {
      const createdAt = new Date(pi.created * 1000);
      return {
        state: "held",
        paymentIntentId: pi.id,
        amount: pi.amount / 100,
        createdAt,
        ageDays: (Date.now() - createdAt.getTime()) / 86_400_000,
      };
    }
    if (pi.status === "succeeded") return { state: "captured", paymentIntentId: pi.id, amount: pi.amount_received / 100 };
    return { state: "gone", paymentIntentId: pi.id, status: pi.status };
  } catch (err) {
    console.error("[stripe-hold] inspect failed", err);
    return { state: "none" };
  }
}

export type CaptureResult =
  | { ok: true; paymentIntentId: string; captured: number; shortfall: number }
  | { ok: false; gone: boolean; error: string };

// Captures the hold for the final total. Captures at most what was held;
// `shortfall` is what still needs a separate charge when the price went up
// after booking (add-ons found on site).
export async function captureHold(opts: { paymentIntentId: string; amount: number }): Promise<CaptureResult> {
  const stripe = client();
  if (!stripe) return { ok: false, gone: false, error: "Missing STRIPE_SECRET_KEY" };
  try {
    const pi = await stripe.paymentIntents.retrieve(opts.paymentIntentId);
    if (pi.status === "succeeded") {
      return { ok: true, paymentIntentId: pi.id, captured: pi.amount_received / 100, shortfall: 0 };
    }
    if (pi.status !== "requires_capture") {
      return { ok: false, gone: true, error: `Hold is ${pi.status}, nothing to capture` };
    }
    const wantCents = Math.round(opts.amount * 100);
    const captureCents = Math.min(wantCents, pi.amount);
    const captured = await stripe.paymentIntents.capture(pi.id, { amount_to_capture: captureCents });
    return {
      ok: true,
      paymentIntentId: captured.id,
      captured: captured.amount_received / 100,
      shortfall: Math.max(0, wantCents - captureCents) / 100,
    };
  } catch (err: unknown) {
    const e = err as Stripe.errors.StripeError;
    console.error("[stripe-hold] capture failed", e?.code, e?.message);
    // A hold the issuer already dropped shows up here as a capture error.
    const gone = e?.code === "payment_intent_unexpected_state" || e?.code === "charge_expired_for_capture";
    return { ok: false, gone, error: e?.message || "Capture failed" };
  }
}

// Releases the hold (cancelled job, or a reschedule far enough out that the
// hold would expire first). Safe to call on anything; only a live hold is
// touched.
export async function releaseHold(paymentIntentId: string | null | undefined): Promise<{ released: boolean; reason?: string }> {
  const stripe = client();
  if (!stripe || !paymentIntentId || !paymentIntentId.startsWith("pi_")) return { released: false, reason: "no hold" };
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "requires_capture") return { released: false, reason: `hold is ${pi.status}` };
    await stripe.paymentIntents.cancel(pi.id, { cancellation_reason: "requested_by_customer" });
    return { released: true };
  } catch (err: unknown) {
    const e = err as Stripe.errors.StripeError;
    console.error("[stripe-hold] release failed", e?.code, e?.message);
    return { released: false, reason: e?.message || "release failed" };
  }
}

// Days between today (New York) and a YYYY-MM-DD service date.
export function daysUntil(serviceDate: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return Math.round((Date.parse(`${serviceDate}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}
