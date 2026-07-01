export type BlogPost = {
	slug: string;
	title: string;
	metaTitle: string; // short <60-char title for the <title> tag; title is the on-page H1
	metaDescription: string;
	tag: string;
	publishedAt: string; // ISO date
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
		slug: "how-to-clean-pre-war-apartments",
		metaTitle: "How to Clean a Pre-War Apartment",
		title: "How to clean a pre-war apartment: techniques for radiators, moldings, and old-building grime",
		metaDescription:
			"Pre-war Manhattan apartments collect dirt in ways modern buildings don't. Cleaning techniques for cast-iron radiators, crown moldings, avenue-facing windows, and original hardwood.",
		tag: "Pre-war living",
		publishedAt: "2026-07-01",
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
					"Cast-iron radiators are the single biggest reason pre-war apartments feel dusty. All winter, they drive convection currents that pull dust through the fins, bake it on, and redistribute it around the room. Clean everything else and skip the radiator, and the room re-dusts itself within days.",
					"The technique: work top-down with a long radiator brush between every fin, then vacuum with a crevice tool — behind the unit too, where decades of felted dust collects against the wall. Do this at the start of the clean, not the end, so anything dislodged gets picked up by the rest of the pass. In summer, when radiators are cold, a damp microfiber wipe of each fin gets the baked-on layer that dry brushing won't.",
				],
			},
			{
				heading: "Moldings, picture rails, and door frames",
				paragraphs: [
					"Pre-war trim is deep — crown moldings, picture rails, panel doors — and every horizontal ledge is a dust shelf. The mistake most people make is dry-dusting, which pushes dust off the ledge and into the air, where it resettles.",
					"Use a barely-damp microfiber cloth folded to a fresh face per ledge, and work the room clockwise from the highest trim down. Painted trim in older buildings often carries decades of paint layers that scuff easily, so skip abrasive sponges — if a mark won't lift with a damp cloth and a drop of dish soap, it's probably in the paint, not on it.",
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
					"If your apartment hasn't had the deep baseline in a while, start there — you can see what that looks like in practice in our Upper West Side pre-war walk-up case study.",
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
					"Co-op logistics are built into our booking flow: we collect your building's requirements when you book, issue the COI to your managing agent before your first visit, reserve the service elevator as part of dispatch, and our cleaners check in with the doorman by the building's rules. You can read exactly how that played out for a client in our Upper East Side co-op case study.",
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
