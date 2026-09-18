import HomeClient from "./HomeClient";
import { fetchGoogleRating } from "@/lib/google-rating";

// Server shell for the homepage. The page itself is a client component
// (HomeClient) because of the interactive quote calculator; this wrapper
// exists so the Google rating can be fetched server-side (cached 6h by Next's
// fetch cache) and passed down. When the fetch fails or the Places env is not
// set, HomeClient hides the number rather than showing a stale one.
export default async function Page() {
  const googleRating = await fetchGoogleRating();
  return <HomeClient googleRating={googleRating} />;
}
