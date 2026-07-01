// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS — paste your real Google reviews here.
//
// To swap in a real review: copy the reviewer's first name + last initial,
// their star rating, the review text (trim if long), and the month it was
// posted, straight from your Google Business Profile.
//
// Set GOOGLE_REVIEWS_URL to your Google Business Profile share link
// (Google Business Profile → Ask for reviews → copy the short link, or the
// Maps URL of your listing). Until it's set, the "Read all reviews" button
// is hidden automatically.
//
// The current entries are the site's original testimonials, marked
// source: "Direct". When you paste a real Google review, set its
// source to "Google" — that switches the card to the Google badge.
// ─────────────────────────────────────────────────────────────────────────────

// Official Google Business Profile share link for Manhattan Mint
export const GOOGLE_REVIEWS_URL = "https://share.google/ZE4GZwjFnRtf9SZTU";

export type Review = {
	author: string;
	neighborhood: string;
	rating: 1 | 2 | 3 | 4 | 5;
	text: string;
	date: string; // e.g. "March 2026" — shown under the review
	source: "Google" | "Yelp" | "Direct";
};

export const reviews: Review[] = [
	{
		author: "Jason M.",
		neighborhood: "Midtown",
		rating: 5,
		text: "Fast booking, clear pricing, great results. My apartment has never been this clean — and I've tried four services.",
		date: "April 2026",
		source: "Direct",
	},
	{
		author: "Alex T.",
		neighborhood: "Tribeca",
		rating: 5,
		text: "They cleaned behind the radiators. Nobody does that. Genuinely the most thorough clean I've ever had in New York.",
		date: "May 2026",
		source: "Direct",
	},
	{
		author: "Maya L.",
		neighborhood: "Upper West Side",
		rating: 5,
		text: "Reliable, respectful, and worth every penny. I switched from a larger service six months ago and haven't looked back.",
		date: "February 2026",
		source: "Direct",
	},
	{
		author: "David K.",
		neighborhood: "Chelsea",
		rating: 5,
		text: "Same cleaner every time, which I really value. My apartment feels like a hotel every single visit.",
		date: "May 2026",
		source: "Direct",
	},
	{
		author: "Sarah P.",
		neighborhood: "Upper East Side",
		rating: 5,
		text: "Booked on a Tuesday, they were there Thursday. The doorman even complimented how professionally they handled building entry.",
		date: "June 2026",
		source: "Direct",
	},
	{
		author: "Marcus W.",
		neighborhood: "West Village",
		rating: 5,
		text: "As someone with a 3-bedroom in the West Village, finding a reliable team was hard. Manhattan Mint nailed it on the first visit.",
		date: "March 2026",
		source: "Direct",
	},
];
