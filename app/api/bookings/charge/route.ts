import { NextResponse } from "next/server";
import { chargeCustomer } from "@/lib/stripe-charge";

// Manual charge endpoint — kept for edge cases (charge failed at Job
// Complete, custom amounts, etc.). Normal charges happen automatically
// when the cleaner taps "Job Complete" (see /api/job-event).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { stripeCustomerId, amount, description } = body as {
    stripeCustomerId: string;
    amount: number;
    description: string;
  };

  const result = await chargeCustomer({ stripeCustomerId, amount, description });
  if (!result.ok) {
    const status =
      result.error === "Missing STRIPE_SECRET_KEY" ? 500 :
      result.error === "Stripe customer not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
