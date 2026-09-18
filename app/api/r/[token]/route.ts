import { NextResponse } from "next/server";
import { GOOGLE_REVIEWS_URL, recordReviewClick } from "@/lib/review-tracking";

export const dynamic = "force-dynamic";

// Tracked review link: GET /api/r/<token>/
//
// Looks up the booking by its review_token, stamps review_link_clicked_at on
// the first tap, and 302s to the Google review page. It ALWAYS redirects to
// Google — an unknown token, a missing column, or a database hiccup must never
// leave a customer on an error page.
//
// Link-preview fetchers (iMessage, WhatsApp, Slack…) hit the URL the moment
// the text lands, which would count as a tap before the customer has seen it.
// Those are skipped by user agent.
const PREVIEW_BOT_RE =
  /bot|crawler|spider|preview|facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|skypeuripreview|imessage/i;

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ua = req.headers.get("user-agent") ?? "";

  if (token && !PREVIEW_BOT_RE.test(ua)) {
    try {
      const bookingId = await recordReviewClick(token);
      if (!bookingId) console.warn(`[review-link] unknown token ${token.slice(0, 8)}…`);
    } catch (err: any) {
      console.warn("[review-link] could not record click:", err?.message ?? err);
    }
  }

  const res = NextResponse.redirect(GOOGLE_REVIEWS_URL, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
