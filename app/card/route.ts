import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { accountUrl, verifyCardToken } from "@/lib/manage-token";
import { publicSiteUrl } from "@/lib/referral";

// Short card-on-file link: /card/?c=cus_…&t=<hmac>
//
// Each visit creates a fresh setup-mode Checkout session (saves a card,
// charges nothing) and redirects to it, so the same ~70-character URL works
// in a text today and again next month. Stripe sends the customer back here
// with &saved=1; that leg makes the newest card the customer default and
// stamps it onto every pending/confirmed booking, so the next hold or
// Job Complete charge uses the card they just saved instead of an old one.
// Optional &n=a sends them to their account page afterwards instead of
// /thank-you. Mint the URL with cardUrl() in src/lib/manage-token.ts.

export const dynamic = "force-dynamic";

// Link-preview fetchers hit the URL the moment the text lands; don't mint a
// Checkout session for them. Serve a plain title instead.
const PREVIEW_BOT_RE =
  /bot|crawler|spider|preview|facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|skypeuripreview|imessage/i;

function html(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:420px;margin:60px auto;padding:0 20px;color:#222"><h2 style="margin:0 0 12px">${title}</h2><p style="color:#555;line-height:1.5">${body}</p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cus = (url.searchParams.get("c") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  const saved = url.searchParams.get("saved") === "1";
  const next = url.searchParams.get("n") || "";
  const siteUrl = publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);

  if (!cus.startsWith("cus_") || !verifyCardToken(cus, token)) {
    return html("This link isn't valid", "Text us at the number you booked with and we'll send a fresh one.", 403);
  }
  if (PREVIEW_BOT_RE.test(req.headers.get("user-agent") ?? "")) {
    return html("Save your card — Manhattan Mint", "Secure card setup. Nothing is charged until after your clean.");
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return html("Card setup unavailable", "Stripe isn't configured. Please text us.", 500);
  const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

  if (saved) {
    // Return leg: make the card they just saved the one we charge.
    try {
      const pms = await stripe.paymentMethods.list({ customer: cus, type: "card", limit: 10 });
      const newest = pms.data.sort((a, b) => b.created - a.created)[0];
      if (newest) {
        await stripe.customers.update(cus, { invoice_settings: { default_payment_method: newest.id } });
        const { data: custRows } = await supabaseAdmin.from("customers").select("id").eq("stripe_customer_id", cus);
        const customerIds = (custRows ?? []).map((r) => r.id);
        const orFilter = [`stripe_customer_id.eq.${cus}`, ...customerIds.map((id) => `customer_id.eq.${id}`)].join(",");
        const { error } = await supabaseAdmin
          .from("bookings")
          .update({ stripe_payment_method_id: newest.id, stripe_customer_id: cus })
          .in("status", ["pending", "confirmed"])
          .or(orFilter);
        if (error) console.error("[card] stamp failed:", cus, error.message);
        else console.log(`[card] ${cus} saved ${newest.card?.brand} ••${newest.card?.last4}; stamped open bookings`);
        if (next === "a" && customerIds[0]) {
          return NextResponse.redirect(`${accountUrl(customerIds[0], siteUrl)}&card=saved`, 302);
        }
      }
    } catch (err: unknown) {
      console.error("[card] return leg failed:", cus, err instanceof Error ? err.message : err);
    }
    return NextResponse.redirect(`${siteUrl}/thank-you?card=saved`, 302);
  }

  try {
    const back = new URLSearchParams({ c: cus, t: token, ...(next ? { n: next } : {}) }).toString();
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: cus,
      payment_method_types: ["card"],
      success_url: `${siteUrl}/card/?${back}&saved=1`,
      cancel_url: `${siteUrl}/thank-you`,
    });
    if (!session.url) throw new Error("no session url");
    return NextResponse.redirect(session.url, 302);
  } catch (err: unknown) {
    console.error("[card]", cus, err instanceof Error ? err.message : err);
    return html("Couldn't open the card page", "Please try again in a minute, or text us and we'll send a new link.", 502);
  }
}
