// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS — real Google reviews, pulled from the Manhattan Mint
// Google Business Profile (5.0 rating, 16 reviews as of July 2026).
//
// To add a new one: copy the reviewer's name, star rating, text, and month
// from the profile and add an entry with source: "Google".
// GOOGLE_REVIEWS_URL is the official profile share link.
// ─────────────────────────────────────────────────────────────────────────────

// Official Google Business Profile share link for Manhattan Mint
export const GOOGLE_REVIEWS_URL = "https://share.google/ZE4GZwjFnRtf9SZTU";

export const GOOGLE_RATING = "5.0";
export const GOOGLE_REVIEW_COUNT = 16;

export type Review = {
	author: string;
	neighborhood?: string;
	rating: 1 | 2 | 3 | 4 | 5;
	text: string;
	date: string; // e.g. "June 2026" — shown under the review
	source: "Google" | "Yelp" | "Direct";
};

export const reviews: Review[] = [
	{
		author: "Ethan Kaplan",
		rating: 5,
		text: "Found my new cleaning service. They came on time and did a great job. Definitely recommend if you live in the city.",
		date: "June 2026",
		source: "Google",
	},
	{
		author: "Alexia Martin",
		rating: 5,
		text: "Exceptional service, always friendly professional and do a great job. Highly recommend.",
		date: "June 2026",
		source: "Google",
	},
	{
		author: "Brianna Heaney",
		rating: 5,
		text: "Amazing experience! Very thorough, professional, and always timely. 10/10 recommend",
		date: "June 2026",
		source: "Google",
	},
	{
		author: "Hailey S",
		rating: 5,
		text: "quick and easy booking, employees are professional and trustworthy!",
		date: "June 2026",
		source: "Google",
	},
	{
		author: "Ricky Dodge",
		rating: 5,
		text: "Quality doesn't cost, it pays. Worth every penny!",
		date: "June 2026",
		source: "Google",
	},
	{
		author: "Xhesika Doci",
		rating: 5,
		text: "great service and great results. highly recommend!",
		date: "June 2026",
		source: "Google",
	},
	// More from the profile, ready to swap in:
	// Caroline Welsh — "Always great! Very timely and professional!"
	// Florence Amelia — "Great service, would definitely recommend"
	// Connor Byrne — "Quick and efficient"
	// Zachary Petrolia — "Highly recommend"
];
