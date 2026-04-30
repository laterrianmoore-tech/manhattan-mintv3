import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { stripeCustomerId, amount, description } = body as {
      stripeCustomerId: string;
      amount: number;
      description: string;
    };

    if (!stripeCustomerId || !amount || amount <= 0) {
      return NextResponse.json({ error: "stripeCustomerId and a positive amount are required" }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted) {
      return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 });
    }

    const defaultPm = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
    if (!defaultPm) {
      return NextResponse.json({ error: "No default payment method on file for this customer" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert dollars to cents
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: defaultPm as string,
      off_session: true,
      confirm: true,
      description: description || "Manhattan Mint cleaning service",
    });

    return NextResponse.json({
      ok: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    });
  } catch (error: unknown) {
    const stripeError = error as Stripe.StripeRawError;
    console.error("charge error", stripeError);
    return NextResponse.json(
      { error: stripeError?.message || "Charge failed" },
      { status: stripeError?.statusCode || 500 }
    );
  }
}
