import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
    const body = await req.json().catch(() => ({}));

    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        email: String(body?.email || ""),
        fullName: String(body?.fullName || ""),
      },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("create-setup-intent error", error);
    return NextResponse.json({ error: "Failed to create setup intent" }, { status: 500 });
  }
}
