export type BlogPost = {
	slug: string;
	title: string;
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
};

export const blogPosts: BlogPost[] = [
	{
		slug: "cleaning-services-for-co-ops",
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
	},
];
