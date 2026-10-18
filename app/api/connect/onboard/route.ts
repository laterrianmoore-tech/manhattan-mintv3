import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyConnectToken } from "@/lib/manage-token";
import { publicSiteUrl } from "@/lib/referral";

// Durable Stripe Connect onboarding link.
//
// Stripe account links expire within minutes and are single-use, which makes
// them useless in a text message. This route is the link we text instead:
// /api/connect/onboard?a=acct_…&t=<hmac>. Each visit mints a fresh account
// link for that account and redirects to it, so the same URL works tonight,
// tomorrow, and again if Stripe sends the person back to finish later.
//
// Mint the URL with connectOnboardUrl() in src/lib/manage-token.ts.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountId = (url.searchParams.get("a") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  const siteUrl = publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);

  if (!accountId.startsWith("acct_") || !verifyConnectToken(accountId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 403 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ ok: false, error: "Stripe not configured." }, { status: 500 });

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
    const account = await stripe.accounts.retrieve(accountId);
    // Once onboarding is complete, send them to the Express dashboard instead
    // of the onboarding form (which Stripe would also redirect away from).
    if (account.details_submitted && account.payouts_enabled) {
      const login = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.redirect(login.url, 302);
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${siteUrl}/api/connect/onboard?${url.searchParams.toString()}`,
      return_url: `${siteUrl}/thank-you?connect=done`,
    });
    return NextResponse.redirect(link.url, 302);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[connect/onboard]", accountId, message);
    return NextResponse.json({ ok: false, error: "Couldn't open the Stripe setup page. Text us and we'll send a new link." }, { status: 502 });
  }
}
