// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS — real Google reviews, copied from the Manhattan Mint
// Google Business Profile.
//
// To add a new one: copy the reviewer's name, star rating, text, and month
// from the profile and add an entry with source: "Google".
//
// The overall rating and review count are NOT hardcoded here — the homepage
// pulls them live from Google Places (src/lib/google-rating.ts) and hides the
// number when the fetch fails. GOOGLE_REVIEWS_URL (the official profile share
// link) lives in src/lib/google-reviews.ts and is re-exported for convenience.
// ─────────────────────────────────────────────────────────────────────────────

export { GOOGLE_REVIEWS_URL } from "@/lib/google-reviews";

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
		author: "Nate Joseph",
		rating: 5,
		text: "I cannot praise the results of Manhattan Mint's great deep cleaning job enough! I've hired cleaners before, but this is the first time I can absolutely say that I was absolutely floored by the quality and attention to detail this service provided. Veronica did a phenomenal job cleaning our apartment and I will be having Manhattan Mint clean my apartment every time from now on. I cannot recommend them enough!",
		date: "September 2026",
		source: "Google",
	},
	{
		author: "Lucas McNamara",
		rating: 5,
		text: "Manhattan Mint completely exceeded my expectations. I've used a few cleaning services in the city and this was by far the most thorough and professional. Every corner was spotless, they were on time, and the communication leading up to the appointment was seamless. My apartment hasn't felt this fresh in months. Highly recommend if you want a premium, reliable clean without the hassle",
		date: "July 2026",
		source: "Google",
	},
	{
		author: "Josef Szende",
		rating: 5,
		text: "Cleaned exactly as we asked for! Spotless!",
		date: "August 2026",
		source: "Google",
	},
	{
		author: "Lauren Elia",
		rating: 5,
		text: "The best in the business. Excellent work cannot recommend more",
		date: "July 2026",
		source: "Google",
	},
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
