import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { manageUrl, verifyAccountToken } from "@/lib/manage-token";
import { acceptKeepOffer, keepOfferFor } from "@/lib/keep-offer";
import { sendSms } from "@/lib/openphone";
import { publicSiteUrl, referralCodeFor, referralLink, REFERRAL_FRIEND_DISCOUNT, REFERRAL_REFERRER_CREDIT } from "@/lib/referral";

// Customer account (2026-10-09): everything a client needs to see in one
// place, reached from the signed link in their texts. No login. Upcoming
// visits (each with its move/skip link), past cleans, whether a card is on
// file (with a save-card link when it isn't), and their friend code.

export const dynamic = "force-dynamic";

function fmt(d: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", opts);
}
function nyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
import { arrivalTagFor } from "@/lib/arrival-window";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = (url.searchParams.get("c") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  if (!verifyAccountToken(customerId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  const siteUrl = publicSiteUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, first_name, address, apt_no, stripe_customer_id")
    .eq("id", customerId)
    .single();
  if (!customer) return NextResponse.json({ ok: false, error: "We couldn't find your account." }, { status: 404 });

  const { data: rows } = await supabaseAdmin
    .from("bookings")
    .select("id, service_date, status, frequency, service_summary, preferred_time_ranges, pricing_total, cleaning_notes, stripe_payment_method_id, stripe_customer_id, completed_at, cleaners!bookings_assigned_cleaner_id_fkey(first_name)")
    .eq("customer_id", customerId)
    .neq("status", "cancelled")
    .order("service_date", { ascending: true });
  const bookings = (rows ?? []) as any[];
  const today = nyToday();

  const upcoming = bookings
    .filter((b) => b.service_date >= today && b.status !== "completed")
    .map((b) => ({
      id: b.id,
      date: b.service_date,
      dateLabel: fmt(b.service_date),
      summary: b.service_summary,
      window: arrivalTagFor(b, "account page") ?? (Array.isArray(b.preferred_time_ranges) ? b.preferred_time_ranges.join(", ") : ""),
      price: b.pricing_total,
      cleaner: b.cleaners?.first_name ?? null,
      status: b.status,
      manageUrl: manageUrl(b.id, siteUrl),
    }));
  const past = bookings
    .filter((b) => b.status === "completed")
    .sort((a, b) => (a.service_date < b.service_date ? 1 : -1))
    .slice(0, 12)
    .map((b) => ({ id: b.id, date: b.service_date, dateLabel: fmt(b.service_date, { month: "short", day: "numeric", year: "numeric" }), summary: b.service_summary, price: b.pricing_total, cleaner: b.cleaners?.first_name ?? null }));

  // Plan = the frequency on the newest booking that isn't one-time.
  const latest = bookings[bookings.length - 1];
  const freq = String(latest?.frequency ?? "");
  const plan = freq && !/one/i.test(freq) ? freq : null;

  // Card on file: any booking carrying a payment method, or the Stripe customer's default.
  const stripeCustomerId: string | null = customer.stripe_customer_id ?? bookings.find((b) => b.stripe_customer_id)?.stripe_customer_id ?? null;
  let cardOnFile = bookings.some((b) => b.stripe_payment_method_id);
  let cardLabel: string | null = null;
  let cardSetupUrl: string | null = null;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeCustomerId) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
      const pms = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: "card", limit: 1 });
      if (pms.data[0]?.card) {
        cardOnFile = true;
        cardLabel = `${pms.data[0].card.brand.replace(/^\w/, (c) => c.toUpperCase())} ending in ${pms.data[0].card.last4}`;
      } else if (!cardOnFile) {
        const session = await stripe.checkout.sessions.create({
          mode: "setup",
          customer: stripeCustomerId,
          payment_method_types: ["card"],
          success_url: `${siteUrl}/account/?c=${customerId}&t=${token}&card=saved`,
          cancel_url: `${siteUrl}/account/?c=${customerId}&t=${token}`,
        });
        cardSetupUrl = session.url ?? null;
      }
    } catch (e) {
      console.error("[account] Stripe lookup failed:", (e as Error)?.message);
    }
  }

  const friendCode = referralCodeFor(customerId);
  return NextResponse.json({
    ok: true,
    account: {
      keepOffer: await keepOfferFor(customerId),
      firstName: customer.first_name,
      address: [customer.address, customer.apt_no ? `Apt ${customer.apt_no}` : ""].filter(Boolean).join(" "),
      plan,
      upcoming,
      past,
      card: { onFile: cardOnFile, label: cardLabel, setupUrl: cardSetupUrl },
      friendCode,
      friendLink: referralLink(friendCode, siteUrl),
      friendDiscount: REFERRAL_FRIEND_DISCOUNT,
      referrerCredit: REFERRAL_REFERRER_CREDIT,
      bookUrl: `${siteUrl}/quote/`,
    },
  });
}

// "Keep my cleaner" (2026-10-18): one tap from the account page books the next
// visit two weeks out on the bi-weekly plan. Body: { c, t, action: "keep" }.
export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { /* fall through to validation */ }
  const customerId = String(body?.c ?? "").trim();
  const token = String(body?.t ?? "").trim();
  if (!verifyAccountToken(customerId, token)) {
    return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 401 });
  }
  if (body?.action !== "keep") return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });

  const offer = await keepOfferFor(customerId);
  if (!offer) return NextResponse.json({ ok: false, error: "This offer isn't available right now. Text us and we'll set it up." }, { status: 409 });

  const { bookingId } = await acceptKeepOffer(offer, "account page");
  const dateLabel = fmt(offer.nextDate);
  const ownerPhones = (process.env.OWNER_NOTIFY_PHONE || "").split(",").map((p) => p.trim()).filter(Boolean);
  for (const to of ownerPhones) {
    await sendSms({
      to,
      body: `🔁 KEEP request: ${offer.firstName} wants ${offer.cleanerName ?? "the same cleaner"} every other week. First visit ${dateLabel} (${offer.window.join("/") || "any time"}) at $${offer.price}. Booking is pending in dispatch; assign ${offer.cleanerName ?? "the cleaner"}.`,
      bookingId,
      cleanerId: null,
      recipientType: "customer",
      eventType: "other",
    });
  }
  console.log("[account] keep offer accepted", { customerId, bookingId, price: offer.price, nextDate: offer.nextDate });
  return NextResponse.json({ ok: true, bookingId, dateLabel, price: offer.price, cleaner: offer.cleanerName });
}
