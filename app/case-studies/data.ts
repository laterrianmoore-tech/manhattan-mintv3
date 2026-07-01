export type CaseStudy = {
	slug: string;
	title: string;
	metaTitle: string; // short <60-char title for the <title> tag; title is the on-page H1
	metaDescription: string;
	neighborhood: string;
	propertyType: string;
	service: string;
	publishedAt: string; // ISO date
	excerpt: string;
	challenge: string[];
	approach: { title: string; body: string }[];
	results: string[];
	quote: string;
	quoteAuthor: string;
};

export const caseStudies: CaseStudy[] = [
	{
		slug: "pre-war-walk-up-deep-clean-upper-west-side",
		metaTitle: "Pre-War Walk-Up Deep Clean: UWS Case Study",
		title: "Deep-cleaning a pre-war walk-up studio on the Upper West Side",
		metaDescription:
			"How Manhattan Mint deep-cleaned a 450 sq ft pre-war walk-up studio on the Upper West Side — radiator grime, decades-old fixtures, and small-space storage dust.",
		neighborhood: "Upper West Side",
		propertyType: "Pre-war studio",
		service: "Deep clean",
		publishedAt: "2026-05-12",
		excerpt:
			"450 square feet, a fourth-floor walk-up, and a century of radiator dust. Small spaces are harder to clean well — here's how we do it.",
		challenge: [
			"Pre-war buildings are beautiful, but they collect grime in ways modern apartments don't. This Upper West Side studio — roughly 450 square feet on the fourth floor of a walk-up — had cast-iron radiators that hadn't been cleaned behind in years, original moldings holding decades of dust, and window sills facing a busy avenue that turned black within a week of wiping.",
			"Small spaces add their own problem: when every inch is used for storage, there's no such thing as an easy-to-reach surface. Under-bed storage, over-cabinet baskets, and a loft shelf all needed to be worked around without disturbing the client's system.",
		],
		approach: [
			{
				title: "Radiators first, floors last",
				body: "We clean pre-war apartments top-down and radiators-first, because radiator dust travels. A dedicated brush set and vacuum attachment gets behind and inside the fins — the single most-skipped area in NYC apartment cleaning.",
			},
			{
				title: "Small-space choreography",
				body: "In a studio, two cleaners get in each other's way. We sent one cleaner on a longer visit instead, working zone by zone so stored items went back exactly where they came from.",
			},
			{
				title: "Avenue-facing window treatment",
				body: "Sills and frames facing the avenue got a degreasing wipe rather than a dry dust — city window grime is oily soot, and dry dusting just moves it around.",
			},
		],
		results: [
			"Radiators, moldings, and sills returned to their actual color — the client thought the radiators had been repainted.",
			"The client moved to a recurring every-two-weeks plan with the same cleaner each visit.",
			"Photo summary sent within an hour of completion, reviewed by the founder same-day.",
		],
		quote:
			"Reliable, respectful, and worth every penny. I switched from a larger service six months ago and haven't looked back.",
		quoteAuthor: "Maya L., Upper West Side",
	},
	{
		slug: "co-op-coi-cleaning-upper-east-side",
		metaTitle: "Co-op COI Cleaning: UES Case Study",
		title: "Navigating co-op rules and COI requirements in an Upper East Side building",
		metaDescription:
			"How Manhattan Mint handles strict co-op building requirements — certificates of insurance, service elevator reservations, and doorman protocols — for an Upper East Side clean.",
		neighborhood: "Upper East Side",
		propertyType: "Co-op, doorman building",
		service: "Standard clean, recurring",
		publishedAt: "2026-05-26",
		excerpt:
			"Her co-op board required a COI naming three entities, a service-elevator reservation, and vendor check-in before anyone could clean her apartment. That's a normal Tuesday for us.",
		challenge: [
			"Many Manhattan co-ops won't let a cleaning service through the lobby without paperwork. This Upper East Side building required a certificate of insurance naming the building corporation, the managing agent, and the board — plus a service elevator reservation made 48 hours ahead, and vendor check-in with the doorman on arrival.",
			"The client had already lost a cleaner over this: her previous service missed the elevator window twice and was turned away at the door, leaving her to scramble before houseguests arrived.",
		],
		approach: [
			{
				title: "COI issued before the first visit",
				body: "We collect building requirements at booking. Our insurer issued the COI naming all three required entities and we sent it to the managing agent before the first appointment was even confirmed.",
			},
			{
				title: "Building logistics on our calendar, not the client's",
				body: "The service-elevator reservation is booked by us as part of dispatch — the client never has to call her super. Arrival windows are set to match the elevator slot, not the other way around.",
			},
			{
				title: "Doorman protocol built into the visit",
				body: "Our cleaner checks in with ID, signs the vendor log, and follows house rules on service-entrance use. The doorman knows who we are by name now.",
			},
		],
		results: [
			"First clean happened on schedule, with zero building friction — and every visit since has too.",
			"The building's managing agent keeps our COI on file, so new appointments need no additional paperwork.",
			"The client books recurring visits and has referred two neighbors in the same building.",
		],
		quote:
			"Booked on a Tuesday, they were there Thursday. The doorman even complimented how professionally they handled building entry.",
		quoteAuthor: "Sarah P., Upper East Side",
	},
	{
		slug: "three-bedroom-family-reset-west-village",
		metaTitle: "West Village 3BR Reset: Case Study",
		title: "A full reset for a busy family's three-bedroom in the West Village",
		metaDescription:
			"How Manhattan Mint took a West Village family's three-bedroom from overwhelming to maintainable — first a deep clean, then a recurring schedule built around school pickup.",
		neighborhood: "West Village",
		propertyType: "3-bedroom apartment",
		service: "Deep clean → recurring",
		publishedAt: "2026-06-09",
		excerpt:
			"Two working parents, two kids, a dog, and 1,600 square feet that never stayed clean longer than a weekend. The fix wasn't one heroic clean — it was a system.",
		challenge: [
			"A three-bedroom in Manhattan works harder than a three-bedroom anywhere else: it's the office, the playroom, the gym, and the dog's territory all at once. This West Village family had tried four services and kept hitting the same wall — each clean looked fine on day one and had unravelled by day four.",
			"The real problem wasn't dirt, it was accumulation: toy rotation, school paperwork, pet hair in upholstery, and kitchen grease that one-off cleans never fully reversed.",
		],
		approach: [
			{
				title: "Deep clean as a baseline, not a fix",
				body: "Visit one was a full deep clean — inside the microwave, baseboards, upholstery vacuuming, degreasing the range hood. Not because it solves everything, but because recurring cleans only work when they're maintaining a real baseline.",
			},
			{
				title: "A schedule built around the family",
				body: "Weekly visits timed for school hours, so the apartment resets before the afternoon chaos begins. Same cleaner every week, who knows which toys live where and that the dog is friendly but dramatic.",
			},
			{
				title: "The 30% recurring rate",
				body: "Weekly service runs 30% below our one-time rate — deliberately, because consistent homes are faster to clean and we pass that time back as savings.",
			},
		],
		results: [
			"The apartment now resets weekly instead of decaying between one-off cleans.",
			"Same cleaner for every visit since the first month — no re-explaining the apartment.",
			"The family reclaimed their weekends: no more Saturday morning catch-up cleaning.",
		],
		quote:
			"As someone with a 3-bedroom in the West Village, finding a reliable team was hard. Manhattan Mint nailed it on the first visit.",
		quoteAuthor: "Marcus W., West Village",
	},
	{
		slug: "loft-detail-clean-tribeca",
		metaTitle: "Tribeca Loft Detail Clean: Case Study",
		title: "Detail-cleaning a Tribeca loft: high ceilings, open space, hidden dust",
		metaDescription:
			"How Manhattan Mint detail-cleaned a Tribeca loft — exposed beams, open shelving, oversized windows, and the dust problems that come with open-plan living.",
		neighborhood: "Tribeca",
		propertyType: "Converted loft",
		service: "Deep clean",
		publishedAt: "2026-06-20",
		excerpt:
			"Lofts look minimal and clean by design — which makes the dust on every beam, ledge, and open shelf twice as visible. This one needed a different playbook.",
		challenge: [
			"Converted lofts break the standard cleaning playbook. This Tribeca space had 12-foot ceilings with exposed beams, open metal shelving instead of closed cabinets, oversized industrial windows, and radiators tucked behind custom millwork. Open-plan living means dust has nowhere to hide — every ledge is on display.",
			"The client's previous service cleaned what was reachable and skipped what wasn't, which in a loft means skipping half the apartment's surfaces.",
		],
		approach: [
			{
				title: "Height equipment as standard kit",
				body: "Extension dusters and a step ladder aren't add-ons for a loft — they're the job. Beams, ledges, light fixtures, and the tops of the shelving units all got done, top-down so nothing resettled on finished surfaces.",
			},
			{
				title: "Open shelving, item by item",
				body: "Open shelves can't be dusted around. Each shelf was cleared in sections, wiped, and restaged exactly as photographed before we started.",
			},
			{
				title: "Behind the millwork",
				body: "We cleaned behind the radiator enclosures — the number-one source of the fine dust film the client kept noticing on dark surfaces.",
			},
		],
		results: [
			"The recurring dust film on dark furniture stopped coming back within days.",
			"Every beam, ledge, and fixture cleaned — including the ones no previous service had touched.",
			"The client booked quarterly detail cleans on top of a monthly standard schedule.",
		],
		quote:
			"They cleaned behind the radiators. Nobody does that. Genuinely the most thorough clean I've ever had in New York.",
		quoteAuthor: "Alex T., Tribeca",
	},
];
