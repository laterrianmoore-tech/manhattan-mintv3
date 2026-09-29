// Full FAQ — the homepage shows eight of these; /faq shows all of them grouped.
// Answers are plain strings; [text](/path) becomes a link (see renderInline).
// Prices and policies here must match the quote page and /terms — update all three.

export type FaqItem = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

export const faqGroups: FaqGroup[] = [
	{
		id: "pricing",
		title: "Pricing & what's included",
		items: [
			{
				q: "How much does a cleaning cost?",
				a: "Flat rates by apartment size: studio and 1-bedroom from $175, 2-bedroom from $225, 3-bedroom from $275, and a custom quote for 4+ bedrooms. A deep clean adds $75 and a move-in/move-out clean adds $100. Supplies and equipment are included in every rate. You can see your exact price on the [home page](/#pricing) without entering any details.",
			},
			{
				q: "Do you charge hourly or a flat rate?",
				a: "Both. Most clients book a flat rate because the price is fixed before we arrive. If you'd rather book by the hour (for a partial clean, or a large home you want to cap), it's $65 per hour per cleaner, with a two-hour minimum.",
			},
			{
				q: "What's included in a standard clean?",
				a: "Every room, every visit: dusting all surfaces, mirrors and fixtures, floors vacuumed and mopped, bathrooms scrubbed and disinfected, kitchen counters, stovetop, sink and appliance exteriors, beds made, and trash out. It's 35 points on our [Mint Mark checklist](/#checklist); a deep clean covers 46 and a move-out covers all 59.",
			},
			{
				q: "What's the difference between a standard and a deep clean?",
				a: "A deep clean is a standard clean plus the places a weekly clean skips: baseboards, door frames, light switches, grout, behind and under furniture that moves, and inside the microwave. We recommend a deep clean for a first visit or if it's been more than a couple of months, then standard cleans to maintain it.",
			},
			{
				q: "What extras can I add?",
				a: "Inside cabinets ($55), interior windows ($85), inside the fridge ($45), inside the oven (part of a deep clean), organization ($70) and laundry wash-and-fold ($40). You pick them when you book and see the total before you confirm.",
			},
			{
				q: "Are there any hidden fees?",
				a: "No. The price you see is the price we charge. The only fees are in our [terms](/terms) and both are avoidable: $50 for a cancellation inside 24 hours, and $25 if a card declines and we can't collect within our normal window.",
			},
			{
				q: "Do you offer discounts for recurring cleans?",
				a: "Yes: 30% off weekly, 25% off bi-weekly, 15% off monthly, on every visit. Recurring clients also get the same cleaner each time and priority on their preferred day.",
			},
			{
				q: "Is there a first-time offer?",
				a: "Through October 31, your second clean is free when you book your first: see [Second Clean on Us](/second-clean). After that, our friend program gives you and a friend $50 each when they book with your code.",
			},
		],
	},
	{
		id: "booking",
		title: "Booking & scheduling",
		items: [
			{
				q: "How do I book?",
				a: "Online in about 60 seconds: pick your apartment size, service and a date, and save a card. You'll get a confirmation email straight away and a text from your cleaner on the day. You can also call or text [(914) 863-7902](tel:9148637902) and we'll book it for you.",
			},
			{
				q: "How soon can you come?",
				a: "Online booking is next-day at the earliest. Same-day is often possible when a cleaner has an opening: text us and we'll tell you straight away.",
			},
			{
				q: "What days and times do you work?",
				a: "Seven days a week, with arrival windows of 8am–12pm, 10am–2pm, 12pm–4pm and 4pm–7pm. Pick the windows that suit you when you book and we'll confirm a time inside one of them.",
			},
			{
				q: "How do I cancel or reschedule?",
				a: "Text or email us any time. No contracts, no cancellation fee with 24 hours' notice. Cancellations or changes inside 24 hours carry a $50 fee, because your cleaner has held that slot for you.",
			},
			{
				q: "Do I need to be home during the clean?",
				a: "No. Most clients give us a key, a lockbox code or leave keys with the doorman. Your cleaner texts you when they're on the way, when they arrive and when they're done, and you get a photo summary at the end.",
			},
			{
				q: "How long does a clean take?",
				a: "A standard clean of a 1-bedroom is usually 2–3 hours; a 2-bedroom 3–4 hours. Deep cleans and move-outs take longer, and we'll send two cleaners for larger homes so the visit stays within a half day.",
			},
			{
				q: "Where do you clean?",
				a: "All of Manhattan, from Inwood to Battery Park, and select parts of Brooklyn and Queens on request. If you're outside Manhattan, text us the address and we'll confirm.",
			},
		],
	},
	{
		id: "building",
		title: "Buildings, access & COIs",
		items: [
			{
				q: "My building needs a Certificate of Insurance (COI). Can you provide one?",
				a: "Yes. We're bonded and insured, and we issue COIs naming your building's management company on request, sent before the visit so the front desk has it on file. See how it works in our [Upper East Side co-op case study](/case-studies/co-op-coi-cleaning-upper-east-side).",
			},
			{
				q: "How do you handle doormen and key access?",
				a: "Tell us at booking how your cleaner gets in: doorman, lockbox, key with a neighbour or you'll be home. Our cleaners check in with the front desk, use the service elevator where the building requires it, and never leave a door unlocked.",
			},
			{
				q: "Do you clean walk-ups and pre-war apartments?",
				a: "They're most of what we do. Radiators, crown mouldings, original hardwood and old tile all need different handling than a new build; our [pre-war cleaning guide](/blog/how-to-clean-pre-war-apartments) explains how we approach them.",
			},
			{
				q: "Can you work around a co-op's rules and hours?",
				a: "Yes. Most co-ops allow contractors between 9am and 5pm on weekdays; we schedule inside your building's hours and handle the service-elevator booking if the building needs one.",
			},
		],
	},
	{
		id: "cleaners",
		title: "Our cleaners",
		items: [
			{
				q: "Are your cleaners background-checked?",
				a: "Every cleaner passes a background check through Certn before their first booking, is interviewed in person by the founder, and is trained on the Mint Mark checklist. We're a small, owner-run team, not a marketplace app.",
			},
			{
				q: "Will I get the same cleaner every time?",
				a: "On a recurring plan, yes. The cleaner who learns your apartment is the one who comes back, and if they're ever away we'll tell you in advance and send someone from the same small team.",
			},
			{
				q: "Are you insured?",
				a: "Yes. Manhattan Mint is bonded and carries liability insurance on every visit, and we're COI-ready for buildings that require it.",
			},
			{
				q: "Do you bring your own supplies and equipment?",
				a: "Always. Products, cloths, vacuum and mop are all included. We use eco-friendly, non-toxic products by default; if you prefer a specific product on a specific surface, leave it out with a note and we'll use yours.",
			},
			{
				q: "Are your products safe for kids and pets?",
				a: "Yes. Our default products are non-toxic and fragrance-light. Pets are welcome to stay home; just let us know at booking so your cleaner knows who to expect.",
			},
			{
				q: "Should I tip my cleaner?",
				a: "Tips are never expected and never included in the price. If you'd like to leave one, you can hand it to your cleaner or text us and we'll add it to their pay. 100% of it goes to them.",
			},
		],
	},
	{
		id: "payment",
		title: "Payment & guarantee",
		items: [
			{
				q: "When am I charged?",
				a: "After the clean, never before. Your card is saved securely when you book and charged only once your cleaner marks the job complete. You'll get an emailed receipt the same day.",
			},
			{
				q: "What payment methods do you accept?",
				a: "All major credit and debit cards, processed by Stripe. We don't take cash, so there's nothing to leave out and a receipt for every visit.",
			},
			{
				q: "What if I'm not happy with the clean?",
				a: "Tell us within 48 hours and we'll send a cleaner back to re-do the missed spots at no charge. It's our [Mint Mark guarantee](/#guarantee), written into our [terms](/terms). The guarantee is fulfilled by re-cleaning; we don't offer cash refunds.",
			},
			{
				q: "What happens if something is damaged?",
				a: "Tell us the same day and we'll make it right. We're insured for exactly this, and the founder reviews the photo summary from every job, so there's a record of the apartment before and after.",
			},
			{
				q: "What don't you do?",
				a: "Exterior windows, mold or biohazard removal, lifting heavy furniture, anything above reach of a two-step ladder, and pest-related cleaning. If you're unsure whether something is covered, text us before booking and we'll tell you straight.",
			},
		],
	},
];
