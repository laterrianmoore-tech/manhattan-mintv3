import { fetchGoogleRating } from "@/lib/google-rating";

// Server component: appends " Rated 5.0 on Google across 16 reviews." (live
// numbers) to a sentence, or renders nothing when the rating can't be fetched.
// Used in the author asides on blog posts and case studies so no page in app/
// carries a hardcoded rating.
export default async function GoogleRatedPhrase() {
  const r = await fetchGoogleRating();
  if (!r) return null;
  return (
    <>
      {" "}
      Rated {r.rating.toFixed(1)} on Google across {r.count} {r.count === 1 ? "review" : "reviews"}.
    </>
  );
}
