export type BlogPost = {
	slug: string;
	title: string;
	metaTitle: string; // short <60-char title for the <title> tag; title is the on-page H1
	metaDescription: string;
	tag: string;
	publishedAt: string; // ISO date
	updatedAt?: string; // ISO date — set when a post is substantially revised
	excerpt: string;
	intro: string[];
	sections: {
		heading: string;
		paragraphs: string[];
		list?: string[];
	}[];
	cta: {
		heading: string; // plain text; the part after "|" is rendered in italic mint
		body: string;
		caseStudySlug: string;
		caseStudyLabel: string;
	};
};

export const blogPosts: BlogPost[] = [
	{
		slug: "how-nyc-weather-affects-apartment-cleanliness",
		metaTitle: "How NYC Weather Affects Apartment Cleanliness",
		title: "How NYC weather affects your apartment: a season-by-season cleaning guide",
		metaDescription:
			"Manhattan dirt runs on a calendar — radiator heat season, tracked-in winter salt, plane-tree pollen, summer humidity in fan-less pre-war bathrooms. What each season does to your apartment, and the cleaning schedule that keeps up.",
		tag: "Seasonal upkeep",
		publishedAt: "2026-07-08",
		excerpt:
			"Heat season, salt season, pollen season, humidity season — Manhattan dirt runs on a calendar. What each season does to your apartment, and the schedule that keeps up.",
		intro: [
			"Ask anyone who cleans Manhattan apartments for a living and they'll tell you the borough has more than four seasons. There's radiator season, salt season, pollen season, and humidity season — and each one changes what shows up on your floors, sills, and shelves. The dust you fight in January is not the same problem as the yellow-green film on your sills in April or the white haze by your front door in February.",
			"This guide walks the calendar the way we plan it for our recurring clients: what each season actually does to a Manhattan apartment, what to do about it yourself, and when the big cleans are worth scheduling. It pairs with our [pre-war cleaning guide](/blog/how-to-clean-pre-war-apartments) — the techniques there, the timing here.",
		],
		sections: [
			{
				heading: "Heat season: October 1 to May 31, by law",
				paragraphs: [
					"New York City's heat law requires residential buildings to provide heat from October 1 through May 31 — at least 68°F inside during the day whenever it drops below 55°F outside, and 62°F at night no matter the outdoor temperature. In a steam-heated building, that means your radiators run for eight months of the year. And for those eight months, they drive the convection currents that pull dust through the apartment, bake it onto the fins, and redistribute it around every room.",
					"Steam heat also dries the air out — in a January cold snap, indoor humidity in a radiator-heated apartment can fall into desert range. Dry air keeps dust airborne longer and adds static, which is why it clings to screens and dark furniture all winter. Two things help more than any amount of extra dusting: clean the radiators in September, before the heat comes on and the summer's dust gets baked on, and run a humidifier toward 35–40% humidity so dust settles instead of circulating.",
					"One more heat-season habit: after cold nights, check the sills of single-pane windows. Warm interior air condenses on cold glass, water pools on the sill, and by March you have mildew speckling in the paint. A ten-second wipe after a cold night prevents a spring repaint.",
				],
			},
			{
				heading: "Winter: salt season is floor season",
				paragraphs: [
					"From November to March, every sidewalk in Manhattan is dressed with rock salt and calcium chloride, and a share of it comes home on your shoes. The white haze it leaves isn't ordinary dirt: dry mopping won't lift it, calcium chloride residue stays faintly tacky and attracts more grime, and ground underfoot the crystals work like fine sandpaper on a floor finish. The six feet inside your front door take a whole winter's worth of that wear.",
					"The fix happens at the door, not after the fact: a stiff-bristle mat outside, an absorbent washable mat inside, and a boot tray so wet soles aren't parked on hardwood. Then damp-mop the entry zone weekly through the winter with a pH-neutral cleaner — if a white film survives the first pass, that's salt residue, not dirt, and a second pass with plain water and a well-wrung mop takes it off. On original pre-war floors, don't let salt slush sit; the standing-moisture rules from our [pre-war floor care section](/blog/how-to-clean-pre-war-apartments) apply double in January.",
				],
			},
			{
				heading: "Spring: plane-tree pollen and the open-window trap",
				paragraphs: [
					"The first 70-degree week of spring, the whole city throws its windows open — which is exactly when the London plane trees, Manhattan's most common street tree, release their pollen. From late April into May, that's the yellow-green film that appears on sills, sticks to window screens, and smears instead of lifting when you dry-dust it. Right behind it comes the fluff from the trees' seed balls, which drifts through any open window and collects along baseboards.",
					"During those weeks: keep screens in even when it's beautiful out, and wipe sills with a damp cloth weekly — pollen is sticky, so dry dusting just spreads it. And time your spring deep clean for after the pollen peak, not before. A deep clean in mid-April looks wonderful for about a week; the same clean in late May resets the apartment for the whole summer. That's when we book them for our own recurring clients.",
				],
			},
			{
				heading: "Summer: humidity is a cleaning problem, not just a comfort problem",
				paragraphs: [
					"Once indoor humidity sits above roughly 55–60% — most of July and August in New York — two things wake up: dust mites, which thrive in humid textiles, and mold, which gets its foothold in bathroom grout and caulk lines. Pre-war apartments have it hardest, because many pre-war bathrooms have no exhaust fan at all — a window or an air-shaft vent is the only ventilation, and on a still August day neither moves much air.",
					"The routine that works: after showers, leave the bathroom door open and the window cracked; squeegee the tile if your bathroom is mold-prone. Check caulk lines monthly through the summer — pink or black speckling caught in its first weeks wipes away with a bathroom cleaner, but mold that's colonized the caulk itself has to be recaulked, not scrubbed. No amount of cleaning fixes caulk that's gone dark all the way through.",
					"Window air conditioners deserve their own line item. A window unit recirculates your room air through its filter dozens of times a day — a clean filter is a dust trap working for you, a dirty one is a dust distributor. Most filters slide out from behind the front grille and rinse clean under a faucet in five minutes; do it monthly in season. Wipe the intake grille while you're there, and check that the unit tilts slightly outward so condensation drips outside, not into the wall or down your sill.",
				],
			},
			{
				heading: "All year: avenue soot doesn't take a season off",
				paragraphs: [
					"One Manhattan constant ignores the calendar entirely: traffic soot. If your windows face an avenue or a bus route, the black film on your sills is oily exhaust particulate, and it lands every day of the year. It needs a degreasing wipe — warm water with a drop of dish soap — not a dry dust, and it rewards a weekly cadence over a monthly scrub. The full technique is in our [pre-war cleaning guide](/blog/how-to-clean-pre-war-apartments), and it applies to new construction just as much.",
				],
			},
			{
				heading: "The seasonal calendar we build for recurring clients",
				paragraphs: [
					"Put together, the year looks like this — it's the rhythm we build into recurring plans, and you can run it yourself between professional visits:",
				],
				list: [
					"September: radiator and heat-prep clean — fins, behind the units, window gaskets — before the October 1 heat comes on.",
					"November–March: weekly damp-mop of the entryway to keep salt off the floor finish, on top of the normal cleaning rhythm.",
					"Late May: the spring deep clean, timed after plane-tree pollen peaks — windows, screens, sills, and everything heat season left behind.",
					"July: AC filter rinse, bathroom caulk-and-grout check, and a look inside closets and under-sink cabinets for humidity trouble.",
					"Every week, all year: a damp wipe of avenue-facing sills. Two minutes that keeps soot from becoming a scrubbing job.",
				],
			},
			{
				heading: "A schedule beats a heroic clean",
				paragraphs: [
					"The pattern in all of this: Manhattan apartments don't get dirty randomly, they get dirty on a schedule — so the cleaning has to run on one too. A single deep clean fixes a moment; a calendar fixes the year. That's the thinking behind our recurring plans, and you can see what the switch looks like in practice in our [West Village family reset case study](/case-studies/three-bedroom-family-reset-west-village), where the fix wasn't one heroic clean — it was a system.",
				],
			},
		],
		cta: {
			heading: "Cleaning in NYC is seasonal.|We plan for it.",
			body: "Recurring plans that track the seasons — same cleaner every visit, flat rates from $175, up to 30% off recurring. See the real thing in our",
			caseStudySlug: "three-bedroom-family-reset-west-village",
			caseStudyLabel: "West Village family reset case study",
		},
	},
	{
		slug: "how-to-clean-pre-war-apartments",
		metaTitle: "How to Clean a Pre-War Apartment",
		title: "How to clean a pre-war apartment: techniques for radiators, moldings, and old-building grime",
		metaDescription:
			"Pre-war Manhattan apartments collect dirt in ways modern buildings don't. Cleaning techniques for cast-iron radiators, crown moldings, avenue-facing windows, and original hardwood.",
		tag: "Pre-war living",
		publishedAt: "2026-07-01",
		updatedAt: "2026-07-08",
		excerpt:
			"Cast-iron radiators, crown moldings, single-pane windows facing a bus route — pre-war apartments are beautiful and they fight back. The techniques that actually work.",
		intro: [
			"Roughly half of Manhattan's housing stock was built before World War II, and anyone who lives in it knows the trade: high ceilings, real moldings, and solid walls in exchange for dust that seems to regenerate overnight. That's not your imagination. Pre-war buildings produce and trap dirt differently than post-war construction, and cleaning them well requires different techniques — not just more effort.",
			"Here's what two years of cleaning pre-war apartments across the Upper West Side, the Village, and Harlem has taught us, in enough detail that you can apply it yourself between professional cleans.",
		],
		sections: [
			{
				heading: "Radiators first: the engine of pre-war dust",
				paragraphs: [
					"Cast-iron radiators are the single biggest reason pre-war apartments feel dusty. Under New York's heat law they run from October 1 through May 31 — eight months a year of convection currents that pull dust through the fins, bake it on, and redistribute it around the room. Clean everything else and skip the radiator, and the room re-dusts itself within days. (Our [season-by-season NYC guide](/blog/how-nyc-weather-affects-apartment-cleanliness) covers what the rest of the calendar does to a Manhattan apartment.)",
					"The technique: work top-down with a long radiator brush between every fin, then vacuum with a crevice tool — behind the unit too, where decades of felted dust collects against the wall. Do this at the start of the clean, not the end, so anything dislodged gets picked up by the rest of the pass. In summer, when radiators are cold, a damp microfiber wipe of each fin gets the baked-on layer that dry brushing won't.",
				],
			},
			{
				heading: "Moldings, picture rails, and door frames",
				paragraphs: [
					"Pre-war trim is deep — crown moldings, picture rails, panel doors — and every horizontal ledge is a dust shelf. The mistake most people make is dry-dusting, which pushes dust off the ledge and into the air, where it resettles.",
					"Use a barely-damp microfiber cloth folded to a fresh face per ledge, and work the room clockwise from the highest trim down. Painted trim in older buildings often carries decades of paint layers that scuff easily, so skip abrasive sponges — if a mark won't lift with a damp cloth and a drop of dish soap, it's probably in the paint, not on it.",
					"There's a safety reason to stay gentle, too. Paint applied before 1978 can contain lead, and pre-war trim almost always carries those older layers under the newer coats. Damp cleaning is safe; sanding, dry-scraping, or scrubbing paint down to dust is not. Watch window sashes and sills especially — that's where friction wears paint through fastest. If trim paint is chipping or flaking, don't try to clean it back to fresh paint yourself: in a pre-1960 rental, peeling paint is the owner's responsibility to fix under NYC law, so flag it to your landlord or managing agent instead.",
				],
			},
			{
				heading: "Plaster walls: dust that comes from inside the apartment",
				paragraphs: [
					"Pre-war walls are plaster over lath, not drywall, and plaster moves with the building. As it settles, hairline cracks open along ceiling lines and above door frames and shed a very fine white powder. Clients regularly point us at a shelf or a stretch of floor that 'gets dusty overnight' — if the dust is white and keeps reappearing in a line under the same spot, it's coming out of the wall, not out of the air. Cleaning cadence won't fix that; it's worth a patch next time the room is painted.",
					"The walls themselves want a lighter touch than drywall. Flat and matte paint over plaster burnishes if you scrub it — you'll take the scuff off and leave a permanent shiny patch in its place. Dab marks with a barely-damp cloth and stop early, and keep melamine sponges ('magic erasers') away from matte plaster walls entirely; they're micro-abrasives, and every pass polishes the finish a little more.",
				],
			},
			{
				heading: "Windows that face the avenue",
				paragraphs: [
					"City window grime isn't house dust — it's oily soot from traffic, and dry dusting just smears it around. Sills and frames on avenue-facing windows need a degreasing pass: warm water with a small amount of dish detergent, then a clean-water wipe, then dry. On single-pane pre-war windows, do the glass last so drips from the frame work don't streak a finished pane.",
					"If your sills turn black within a week or two, that's normal for a bus route — it's a cadence problem, not a cleaning problem. A quick weekly sill wipe beats a monthly scrub.",
				],
			},
			{
				heading: "Original hardwood: clean gentle, dry fast",
				paragraphs: [
					"Pre-war herringbone and strip oak often carries a finish that's older and thinner than anything in a modern building. Standing water is the enemy: it finds gaps between boards and swells the edges. Vacuum first (hard-floor head, never a beater bar), then damp-mop with a well-wrung flat mop and a pH-neutral cleaner — never vinegar, which dulls shellac and old polyurethane alike. The floor should be dry within a minute of the mop passing; if you can see standing moisture, the mop is too wet.",
				],
			},
			{
				heading: "The cadence that keeps a pre-war apartment clean",
				paragraphs: [
					"Pre-war apartments reward rhythm over heroics: a weekly light pass on sills and open surfaces, a monthly proper clean including floors and bathrooms, and a deep clean with radiators, moldings, and window frames every season. That's the schedule we build for our recurring pre-war clients, and it's why their apartments stop feeling dusty between visits.",
					"If your apartment hasn't had the deep baseline in a while, start there — you can see what that looks like in practice in our [Upper West Side pre-war walk-up case study](/case-studies/pre-war-walk-up-deep-clean-upper-west-side). And if the building is a co-op, our [co-op cleaning guide](/blog/cleaning-services-for-co-ops) covers the paperwork side before anyone touches a radiator.",
				],
			},
		],
		cta: {
			heading: "Live in a pre-war?|We know the buildings.",
			body: "Radiators, moldings, and original floors are part of our standard deep clean — flat rates from $175. See the real thing in our",
			caseStudySlug: "pre-war-walk-up-deep-clean-upper-west-side",
			caseStudyLabel: "Upper West Side pre-war case study",
		},
	},
	{
		slug: "cleaning-services-for-co-ops",
		metaTitle: "Cleaning Services for Co-ops: NYC Board Rules",
		title: "Cleaning services for co-ops: what NYC boards require, and how to hire right",
		metaDescription:
			"A practical guide to hiring a cleaning service for a NYC co-op — COI requirements, service elevator rules, house rules, and the questions to ask before anyone enters your building.",
		tag: "Co-op living",
		publishedAt: "2026-06-28",
		excerpt:
			"Co-op boards can turn away any vendor at the lobby — and they do, daily. Here's what your building will require from a cleaning service, and how to hire one that already knows the drill.",
		intro: [
			"If you live in a Manhattan co-op, you already know the building has opinions about who comes through the lobby. Contractors, dog walkers, movers — and yes, cleaning services — all typically need to satisfy the board's requirements before they're allowed upstairs. A cleaner who shows up without the right paperwork doesn't get a warning; they get turned away, and you get a text at work asking why there's a stranger in the lobby claiming to know you.",
			"This guide covers what most NYC co-op buildings actually require from a cleaning service, and the questions worth asking before you hire one.",
		],
		sections: [
			{
				heading: "Why co-ops are stricter than condos and rentals",
				paragraphs: [
					"A co-op building is owned collectively by its shareholders, and the board is legally responsible for what happens inside it. That responsibility flows down to every vendor who enters: if a cleaning service damages a hallway, injures themselves in the service elevator, or floods the apartment below yours, the building wants to know someone's insurance is paying — not the building's.",
					"That's why co-op requirements aren't bureaucracy for its own sake. Each rule maps to a specific liability the board is trying to keep off the building's books.",
				],
			},
			{
				heading: "The COI: the document that decides everything",
				paragraphs: [
					"The single most common requirement is a certificate of insurance, or COI. It's a one-page document from the cleaning company's insurer proving the company carries liability coverage — and, critically, naming the parties your building requires as 'additional insured.' Most managing agents want three entities listed: the building's corporate entity, the managing agent, and sometimes the board itself.",
					"Two things trip people up. First, a generic COI isn't enough — it must name your specific building's entities, exactly as the managing agent specifies. Second, timing: agents often need the COI on file 24 to 72 hours before the first visit. A cleaning service that handles COIs routinely will ask for your managing agent's requirements at booking and send the certificate directly — you should never have to play courier.",
				],
			},
			{
				heading: "Service elevators, work hours, and house rules",
				paragraphs: [
					"Beyond insurance, most co-ops enforce building logistics. Vendors typically must use the service entrance and service elevator, which may need to be reserved a day or two ahead. Many buildings restrict vendor hours — commonly weekdays 9 to 5, no weekends — and require vendors to sign in with the doorman or super and show ID.",
					"None of this is a problem if your cleaning service treats it as part of the job. It becomes your problem when the service treats building rules as your responsibility: you end up booking elevators, calling supers, and apologizing to doormen for a vendor who didn't read the memo.",
				],
			},
			{
				heading: "What to ask a cleaning service before you hire them",
				paragraphs: [
					"Five questions separate services that know co-op buildings from services that will get turned away at your lobby:",
				],
				list: [
					"Can you issue a COI naming my building's required entities, and how fast? (Right answer: yes, usually within a business day.)",
					"Who books the service elevator — you or me? (Right answer: they do, as part of scheduling.)",
					"Are your cleaners employees you've background-checked, or gig workers from a marketplace? (Boards — and doormen — notice the difference.)",
					"What happens if my building turns your cleaner away? (Right answer: they reschedule at no charge and fix the paperwork.)",
					"Do you already work in doorman or co-op buildings in my neighborhood? (Ask for a specific example.)",
				],
			},
			{
				heading: "How we handle it at Manhattan Mint",
				paragraphs: [
					"Co-op logistics are built into our booking flow: we collect your building's requirements when you book, issue the COI to your managing agent before your first visit, reserve the service elevator as part of dispatch, and our cleaners check in with the doorman by the building's rules. You can read exactly how that played out for a client in our [Upper East Side co-op case study](/case-studies/co-op-coi-cleaning-upper-east-side). And once the paperwork is squared away, our [pre-war cleaning guide](/blog/how-to-clean-pre-war-apartments) covers what a proper clean should include in an older building.",
				],
			},
		],
		cta: {
			heading: "Live in a co-op?|We speak board.",
			body: "COIs issued before your first visit, service elevators booked for you, flat rates from $175. See the real thing in our",
			caseStudySlug: "co-op-coi-cleaning-upper-east-side",
			caseStudyLabel: "Upper East Side co-op case study",
		},
	},
];
