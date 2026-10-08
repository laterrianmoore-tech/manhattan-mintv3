import Stripe from "stripe";
import { supabaseAdmin } from "./supabase";

// What a booking actually brought in (2026-10-08).
//
// The ledger on /admin/accounting needs two numbers Stripe knows and the
// booking row didn't: what the customer really paid (a hold captured for less
// than the ticket, an invoice paid later, a $0 re-clean) and Stripe's fee on
// it. Both are copied onto the booking once the money moves so the ledger is
// a plain database read. Called after Job Complete charges the card, and by
// scripts/backfill-cleaner-pay-1008.mjs for jobs completed before this existed.
//
// Never throws: accounting is downstream of the job flow, not part of it.

const API_VERSION = "2026-02-25.clover" as const;

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: API_VERSION }) : null;
}

export type Collection = {
  collectedCents: number;
  feeCents: number;
  collectedAt: string;
  ref: string;
};

/** Fee + amount for a succeeded PaymentIntent (or legacy charge id). */
export async function collectionForPayment(paymentId: string): Promise<Collection | null> {
  const stripe = client();
  if (!stripe || !paymentId) return null;
  try {
    let charge: Stripe.Charge | null = null;
    if (paymentId.startsWith("pi_")) {
      const pi = await stripe.paymentIntents.retrieve(paymentId, { expand: ["latest_charge.balance_transaction"] });
      if (pi.status !== "succeeded") return null;
      charge = (pi.latest_charge as Stripe.Charge | null) ?? null;
    } else if (paymentId.startsWith("ch_")) {
      charge = await stripe.charges.retrieve(paymentId, { expand: ["balance_transaction"] });
    }
    if (!charge || charge.status !== "succeeded") return null;
    const bt = charge.balance_transaction as Stripe.BalanceTransaction | null;
    return {
      collectedCents: charge.amount_captured ?? charge.amount,
      feeCents: bt?.fee ?? 0,
      collectedAt: new Date(charge.created * 1000).toISOString(),
      ref: charge.payment_intent ? String(charge.payment_intent) : charge.id,
    };
  } catch (e) {
    console.error("[stripe-accounting] payment lookup failed:", paymentId, (e as Error)?.message);
    return null;
  }
}

/** Fee + amount for a paid Stripe invoice tagged with this booking (metadata.supabase_booking_id). */
export async function collectionForInvoice(bookingId: string): Promise<Collection | null> {
  const stripe = client();
  if (!stripe) return null;
  try {
    const found = await stripe.invoices.search({
      query: `metadata["supabase_booking_id"]:"${bookingId}" AND status:"paid"`,
      limit: 1,
      expand: ["data.payments.data.payment.payment_intent"],
    });
    const inv = found.data[0];
    if (!inv) return null;
    // Fee lives on the charge behind the invoice's payment.
    let feeCents = 0;
    let ref = inv.id;
    const payment = (inv as any).payments?.data?.[0]?.payment?.payment_intent as Stripe.PaymentIntent | string | undefined;
    const piId = typeof payment === "string" ? payment : payment?.id;
    if (piId) {
      const c = await collectionForPayment(piId);
      if (c) {
        feeCents = c.feeCents;
        ref = `${inv.id} / ${c.ref}`;
      }
    }
    return {
      collectedCents: inv.amount_paid,
      feeCents,
      collectedAt: new Date(((inv.status_transitions?.paid_at ?? inv.created) as number) * 1000).toISOString(),
      ref,
    };
  } catch (e) {
    console.error("[stripe-accounting] invoice lookup failed:", bookingId, (e as Error)?.message);
    return null;
  }
}

/**
 * Copy the collected amount + fee onto the booking. Reads stripe_charge_id
 * fresh (Job Complete may have just set it), falls back to a paid invoice.
 * Returns what was recorded, or null if nothing has been paid yet.
 */
export async function recordCollection(bookingId: string): Promise<Collection | null> {
  try {
    const { data: b } = await supabaseAdmin
      .from("bookings")
      .select("id, stripe_charge_id, pricing_total")
      .eq("id", bookingId)
      .single();
    if (!b) return null;
    let c: Collection | null = null;
    if ((b as any).stripe_charge_id) c = await collectionForPayment((b as any).stripe_charge_id);
    if (!c) c = await collectionForInvoice(bookingId);
    if (!c && Number((b as any).pricing_total ?? 0) === 0) {
      // $0 job (guarantee re-clean, make-good): nothing to collect, say so explicitly.
      c = { collectedCents: 0, feeCents: 0, collectedAt: new Date().toISOString(), ref: "no charge ($0 job)" };
    }
    if (!c) return null;
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        collected_cents: c.collectedCents,
        stripe_fee_cents: c.feeCents,
        collected_at: c.collectedAt,
        collected_ref: c.ref,
      })
      .eq("id", bookingId);
    if (error) {
      console.error("[stripe-accounting] not stored (run migrations/2026-10-08-cleaner-pay.sql):", error.message);
      return null;
    }
    return c;
  } catch (e) {
    console.error("[stripe-accounting] recordCollection failed:", (e as Error)?.message);
    return null;
  }
}
