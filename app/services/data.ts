import type { Tier } from "../components/checklist-data";

// Service landing pages — one per search intent ("deep cleaning NYC",
// "move out cleaning Manhattan"). Deliberately only the three that bring
// bookings; recurring/housekeeping is covered by the home page pricing.
// What's-included lists come from the Mint Mark checklist (CleanChecklist.tsx)
// via `tier`, so they never drift from the home page.

export type ServicePage = {
	slug: string;
	tier: Tier;
	name: string; // short, for nav/breadcrumbs
	metaTitle: string;
	metaDescription: string;
	eyebrow: string;
	h1: [string, string]; // second part rendered italic mint
	lede: string;
	price: { from: string; note: string };
	bestFor: string[];
	howItWorks: { title: string; body: string }[];
	notIncluded?: string;
	caseStudy: { slug: string; label: string };
	guide: { slug: string; label: string };
	faqs: string[]; // question text, matched against app/faq/data.ts
	cta: { heading: [string, string]; body: string };
};

export const servicePages: ServicePage[] = [
	{
		slug: "apartment-cleaning",
		tier: "Standard",
		name: "Apartment cleaning",
		metaTitle: "Apartment Cleaning NYC — Flat Rate, Same Cleaner",
		metaDescription:
			"Manhattan apartment cleaning from $175 flat. Background-checked cleaner, eco-friendly supplies included, charged only after the clean. Same cleaner every visit on recurring plans, up to 30% off.",
		eyebrow: "Apartment cleaning · Manhattan",
		h1: ["Apartment cleaning,", "done the Manhattan way."],
		lede:
			"Thirty-five details in every room, every visit, by a cleaner who's background-checked, insured and trained on our Mint Mark checklist. Supplies included, flat rate, and your card is only charged once the job's done.",
		price: { from: "$175", note: "Studio / 1BR · $225 2BR · $275 3BR · custom for 4+" },
		bestFor: [
			"Weekly or bi-weekly upkeep so the apartment never gets away from you",
			"A one-off clean before guests, after a busy stretch, or just because",
			"Anyone who wants the same person each time, not a new stranger from an app",
		],
		howItWorks: [
			{ title: "Price it in 60 seconds", body: "Pick your apartment size and how often. The exact price shows before you enter a single detail." },
			{ title: "We handle your building", body: "Doorman, lockbox or key: tell us once. COIs for co-ops and condos are sent before the first visit." },
			{ title: "Charged after, with photos", body: "Your cleaner texts on the way, on arrival and when done. You get a photo summary; then, and only then, the card is charged." },
		],
		caseStudy: { slug: "co-op-coi-cleaning-upper-east-side", label: "Upper East Side co-op, recurring standard cleans" },
		guide: { slug: "how-nyc-weather-affects-apartment-cleanliness", label: "How NYC weather affects your apartment" },
		faqs: [
			"What's included in a standard clean?",
			"Do you offer discounts for recurring cleans?",
			"Will I get the same cleaner every time?",
			"Do I need to be home during the clean?",
			"When am I charged?",
		],
		cta: { heading: ["Ready for the cleanest", "apartment in Manhattan?"], body: "See your exact price on the home page and book in 60 seconds. First clean not right? We come back and fix it, free." },
	},
	{
		slug: "deep-cleaning",
		tier: "Deep Clean",
		name: "Deep cleaning",
		metaTitle: "Deep Cleaning NYC — 46-Detail Reset for Manhattan Apartments",
		metaDescription:
			"Manhattan deep cleaning: a 46-detail reset covering baseboards, grout, door frames, inside the microwave and everything a weekly clean skips. Standard price + $75, supplies included, re-clean guarantee.",
		eyebrow: "Deep cleaning · Manhattan",
		h1: ["The reset your apartment", "actually needs."],
		lede:
			"Everything in a standard clean plus the 11 details a weekly clean doesn't reach: baseboards, door frames, grout, light switches, behind and under what moves, inside the microwave. It's the clean we recommend for a first visit, or whenever it's been a while.",
		price: { from: "+$75", note: "On top of your flat rate · e.g. 1BR deep clean $250 · Free on your first visit when you start a weekly or bi-weekly plan" },
		bestFor: [
			"A first visit, so recurring cleans start from a clean baseline (and it's free when you start a weekly or bi-weekly plan)",
			"Seasonal resets: before the heat comes on in October, or after winter",
			"After a renovation, a long trip, or a stretch where cleaning slipped",
			"Pre-war apartments, where radiators, mouldings and old tile hold dirt",
		],
		howItWorks: [
			{ title: "Pick 'Deep clean' when you price it", body: "Add it to any apartment size. The price updates instantly, and you can add inside-fridge or inside-cabinets if you want the full reset." },
			{ title: "We allow the extra time", body: "A deep clean takes roughly half again as long as a standard clean. For larger homes we send two cleaners so it finishes in one visit." },
			{ title: "Photos, then the charge", body: "Your cleaner works room by room through all 46 details. You get a photo summary at the end and the card is charged only after." },
		],
		notIncluded: "A deep clean doesn't include inside the oven, fridge, cabinets or closets; those are extras or part of a move-out clean. Exterior windows, mold and post-construction dust are not something we take on.",
		caseStudy: { slug: "pre-war-walk-up-deep-clean-upper-west-side", label: "Pre-war walk-up deep clean, Upper West Side" },
		guide: { slug: "fall-cleaning-checklist-manhattan-apartment", label: "The fall reset: what to clean before the heat comes on" },
		faqs: [
			"What's the difference between a standard and a deep clean?",
			"How long does a clean take?",
			"What extras can I add?",
			"Do you clean walk-ups and pre-war apartments?",
			"What if I'm not happy with the clean?",
		],
		cta: { heading: ["Start with the reset,", "and we'll cover it."], body: "Book a weekly or bi-weekly plan and the deep clean on your first visit is on us: the full 46 details, $75 off, then standard cleans at up to 30% off from visit two. Price yours on the home page." },
	},
	{
		slug: "move-in-move-out-cleaning",
		tier: "Move Out",
		name: "Move in / move out",
		metaTitle: "Move Out Cleaning NYC — Deposit-Ready in 48 Hours",
		metaDescription:
			"Manhattan move-in and move-out cleaning: all 59 Mint Mark details including inside the oven, fridge, cabinets and closets. Deposit-ready, 48-hour turnaround, COI for your building. Standard price + $100.",
		eyebrow: "Move in / move out · Manhattan",
		h1: ["Hand back the keys", "and get the deposit back."],
		lede:
			"All 59 details on the Mint Mark checklist: a deep clean plus inside the oven, fridge, cabinets and closets, ready for a landlord's walkthrough or your first night in a new place. Empty apartments preferred; we can work around boxes.",
		price: { from: "+$100", note: "On top of your flat rate · e.g. 1BR move-out $275" },
		bestFor: [
			"Move-outs where the deposit depends on the walkthrough",
			"Move-ins, so the first thing you do in the new place isn't clean it",
			"Brokers and landlords turning a unit between tenants (see our partner program)",
			"Sublets and short-term rentals between guests",
		],
		howItWorks: [
			{ title: "Book around your move date", body: "Tell us the day the apartment is empty (or nearly). We can usually turn a unit within 48 hours of the request." },
			{ title: "Building paperwork handled", body: "Management company needs a COI? We send it before the visit. Service elevator booking? On our calendar, not yours." },
			{ title: "Walkthrough-ready, with proof", body: "You get a photo summary of every room, which doubles as your record if a landlord questions the condition." },
		],
		notIncluded: "We don't remove furniture or trash left behind, patch walls, or clean exterior windows. Heavy post-construction dust needs a specialist crew.",
		caseStudy: { slug: "loft-detail-clean-tribeca", label: "Tribeca loft detail clean" },
		guide: { slug: "cleaning-services-for-co-ops", label: "Cleaning services for co-ops: what boards require" },
		faqs: [
			"How soon can you come?",
			"My building needs a Certificate of Insurance (COI). Can you provide one?",
			"How long does a clean take?",
			"What don't you do?",
			"When am I charged?",
		],
		cta: { heading: ["Moving in Manhattan", "is hard enough."], body: "Take the clean off the list. Price a move-out on the home page, or text us the date and we'll confirm a slot. Agents: see our broker partner program." },
	},
];
