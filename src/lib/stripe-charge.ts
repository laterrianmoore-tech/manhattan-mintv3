import Stripe from "stripe";

export type ChargeResult =
  | { ok: true; paymentIntentId: string; status: string; amount: number }
  | { ok: false; error: string };

// Charges a saved card off-session. Prefers the default payment method,
// falls back to the most recently added card (cards added via the
// post-booking Checkout setup link attach but aren't set as default).
export async function chargeCustomer(opts: {
  stripeCustomerId: string;
  amount: number; // dollars
  description: string;
}): Promise<ChargeResult> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { ok: false, error: "Missing STRIPE_SECRET_KEY" };
  if (!opts.stripeCustomerId || !opts.amount || opts.amount <= 0) {
    return { ok: false, error: "stripeCustomerId and a positive amount are required" };
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

    const customer = await stripe.customers.retrieve(opts.stripeCustomerId);
    if (customer.deleted) return { ok: false, error: "Stripe customer not found" };

    let defaultPm = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
    if (!defaultPm) {
      const pms = await stripe.paymentMethods.list({
        customer: opts.stripeCustomerId,
        type: "card",
        limit: 1,
      });
      defaultPm = pms.data[0]?.id;
    }
    if (!defaultPm) return { ok: false, error: "No payment method on file for this customer" };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(opts.amount * 100), // dollars → cents
      currency: "usd",
      customer: opts.stripeCustomerId,
      payment_method: defaultPm as string,
      off_session: true,
      confirm: true,
      description: opts.description || "Manhattan Mint cleaning service",
    });

    return {
      ok: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error: unknown) {
    const stripeError = error as Stripe.StripeRawError;
    console.error("charge error", stripeError);
    return { ok: false, error: stripeError?.message || "Charge failed" };
  }
}
