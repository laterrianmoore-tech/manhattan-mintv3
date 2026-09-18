// Live Google rating for the homepage stats band.
//
// Reads rating + review count from the Google Places API for the business's
// place id. Cached by Next's fetch cache for 6 hours. Returns null whenever the
// env is missing or the call fails, and callers must then HIDE the number —
// never show a hardcoded or stale figure as if it were live.
//
// Env (Netlify → Site settings → Environment variables):
//   GOOGLE_PLACES_API_KEY  — a key with the Places API enabled
//   GOOGLE_PLACE_ID        — the Manhattan Mint listing's place id
//                            (find it with Google's Place ID Finder:
//                            https://developers.google.com/maps/documentation/places/web-service/place-id)

export type GoogleRating = { rating: number; count: number };

const REVALIDATE_SECONDS = 6 * 60 * 60;

function parse(rating: unknown, count: unknown): GoogleRating | null {
  const r = Number(rating);
  const c = Number(count);
  if (!Number.isFinite(r) || r <= 0 || r > 5) return null;
  if (!Number.isFinite(c) || c < 0) return null;
  return { rating: r, count: Math.round(c) };
}

export async function fetchGoogleRating(): Promise<GoogleRating | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  // Places API (New) — the endpoint Google issues to new keys.
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount",
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (res.ok) {
      const data = await res.json();
      const parsed = parse(data?.rating, data?.userRatingCount);
      if (parsed) return parsed;
    } else {
      console.warn(`[google-rating] Places (New) returned ${res.status}; trying legacy Details`);
    }
  } catch (err: any) {
    console.warn("[google-rating] Places (New) failed:", err?.message ?? err);
  }

  // Legacy Place Details — still works for keys created before March 2025.
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: "rating,user_ratings_total",
      key: apiKey,
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.warn(`[google-rating] legacy Details returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data?.status !== "OK") {
      console.warn(`[google-rating] legacy Details status ${data?.status}: ${data?.error_message ?? ""}`);
      return null;
    }
    return parse(data?.result?.rating, data?.result?.user_ratings_total);
  } catch (err: any) {
    console.warn("[google-rating] legacy Details failed:", err?.message ?? err);
    return null;
  }
}
