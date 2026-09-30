// Neighborhood landing pages — one per area we work most. Each page has to
// read as written by someone who cleans there, not a template with the name
// swapped: building stock, how you get in, what the dirt is actually like,
// which service people there book. Photos live in /public/neighborhoods/.

export type Neighborhood = {
	slug: string;
	name: string;
	metaTitle: string;
	metaDescription: string;
	bounds: string; // "from X to Y" line under the H1
	h1: [string, string]; // second half italic mint
	lede: string;
	image?: { src: string; alt: string; credit?: string };
	buildings: { title: string; body: string }[]; // what we clean here
	realities: string[]; // what the dirt is like in this area
	access: string; // doormen / COIs / walk-ups
	popular: { service: string; serviceSlug: string; why: string; example: string };
	caseStudy: { slug: string; label: string };
	guide: { slug: string; label: string };
	faqs: string[]; // exact question text from app/faq/data.ts
	nearby: string[]; // slugs
};

export const neighborhoods: Neighborhood[] = [
	{
		slug: "upper-west-side",
		name: "Upper West Side",
		metaTitle: "Upper West Side Apartment Cleaning — Manhattan Mint",
		metaDescription:
			"Apartment cleaning on the Upper West Side: pre-war walk-ups, Riverside and Central Park West co-ops, radiator dust and avenue soot. Flat rates from $175, same cleaner every visit, COI-ready.",
		bounds: "59th to 110th Street, Central Park West to Riverside Drive",
		h1: ["Upper West Side cleaning,", "pre-war dust included."],
		lede:
			"Half our Upper West Side clients live in buildings older than their grandparents: brownstone walk-ups on the side streets, big pre-war co-ops on the avenues. Both collect dirt in ways a new building never will, and both are what we're built for.",
		buildings: [
			{ title: "Brownstone and townhouse walk-ups", body: "Side-street floor-throughs and studios, three to five flights up. Original hardwood, plaster walls, a radiator under every window." },
			{ title: "Pre-war co-ops on the avenues", body: "Central Park West, West End, Riverside. Doorman buildings with boards, service elevators and COI requirements, and apartments with moldings that hold a decade of dust." },
			{ title: "Family apartments", body: "More two- and three-bedrooms than anywhere else we work. Kids' rooms, strollers in the hall, and a kitchen that gets used three times a day." },
		],
		realities: [
			"Radiator dust is the defining problem. Steam heat runs October through May and moves everything that isn't wiped off the fins in September.",
			"Avenue-facing windows get an oily soot from Broadway and Amsterdam traffic that smears if you dry-dust it.",
			"Plane-tree pollen off Central Park and Riverside in late April coats sills and screens for three weeks.",
			"Original hardwood can't take standing water; we damp-mop, never wet-mop, and dry as we go.",
		],
		access:
			"Walk-ups: a key, a lockbox or a neighbor works. Doorman buildings: we check in at the desk, use the service elevator where the house rules require it, and send a COI to management before the first visit. Most UWS co-ops allow contractors 9am–5pm on weekdays; we schedule inside those hours.",
		popular: {
			service: "Bi-weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Families here want the apartment reset every other week without thinking about it, with the same cleaner who knows where the toys go.",
			example: "2BR / 1BA: $225 first visit, $169 per visit bi-weekly after that.",
		},
		caseStudy: { slug: "pre-war-walk-up-deep-clean-upper-west-side", label: "Deep-cleaning a pre-war walk-up studio on the Upper West Side" },
		guide: { slug: "how-to-clean-pre-war-apartments", label: "How to clean a pre-war apartment" },
		faqs: ["Do you clean walk-ups and pre-war apartments?", "Will I get the same cleaner every time?", "My building needs a Certificate of Insurance (COI). Can you provide one?", "Are your products safe for kids and pets?"],
		nearby: ["upper-east-side", "chelsea", "murray-hill"],
	},
	{
		slug: "upper-east-side",
		name: "Upper East Side",
		metaTitle: "Upper East Side Apartment Cleaning — COI-Ready Co-op Cleaners",
		metaDescription:
			"Apartment cleaning on the Upper East Side: doorman co-ops with strict boards, COIs sent before the first visit, service-elevator bookings handled. Flat rates from $175, same cleaner every visit.",
		bounds: "59th to 96th Street, Fifth Avenue to the East River",
		h1: ["Upper East Side cleaning", "your board will approve of."],
		lede:
			"On the Upper East Side the building is half the job. Co-op boards want a Certificate of Insurance on file, doormen want to know who's coming, and the service elevator has hours. We handle all of it before your cleaner rings the bell.",
		buildings: [
			{ title: "Doorman co-ops and condos", body: "Park, Fifth, Madison and Lexington. Boards with rules, front desks that log every visitor, and apartments with more square footage than most of Manhattan." },
			{ title: "Yorkville high-rises", body: "East of Third, newer rental and condo towers with package rooms, in-unit laundry and the kind of white kitchen that shows every fingerprint." },
			{ title: "Side-street townhouses and walk-ups", body: "Between the avenues, smaller pre-war buildings and converted townhouses, often with a garden-level unit." },
		],
		realities: [
			"COIs are routine here, not a special request. We issue them naming your management company and send them before the first visit.",
			"Contractor hours are real. Most buildings allow 9am–5pm Monday to Friday, some 10am–4pm; we book inside your building's window.",
			"Large apartments mean two cleaners on deep cleans so the visit stays inside a half day.",
			"Marble, stone and glass: more of it here than anywhere. We carry pH-neutral products because vinegar and bleach etch stone.",
		],
		access:
			"Tell us the management company at booking and we'll have the COI at the front desk before day one. Your cleaner checks in with the doorman, takes the service elevator, and never props a door. If you'd rather leave a key with the desk than be home, that's how most of our UES clients do it.",
		popular: {
			service: "Recurring standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Once the building paperwork is done, clients here want the same vetted cleaner on a fixed day, every other week or monthly, with nothing to re-explain.",
			example: "2BR / 2BA: $250 first visit, $188 per visit bi-weekly, $213 monthly.",
		},
		caseStudy: { slug: "co-op-coi-cleaning-upper-east-side", label: "Navigating co-op rules and COI requirements in an Upper East Side building" },
		guide: { slug: "cleaning-services-for-co-ops", label: "Cleaning services for co-ops: what NYC boards require" },
		faqs: ["My building needs a Certificate of Insurance (COI). Can you provide one?", "Can you work around a co-op's rules and hours?", "How do you handle doormen and key access?", "Are you insured?"],
		nearby: ["upper-west-side", "murray-hill", "flatiron"],
	},
	{
		slug: "chelsea",
		name: "Chelsea",
		metaTitle: "Chelsea Apartment Cleaning — Lofts, Townhouses & High Line Condos",
		metaDescription:
			"Apartment cleaning in Chelsea: pre-war walk-ups on the side streets, glass condos along the High Line, gallery-district lofts. Flat rates from $175, eco-friendly supplies, charged after the clean.",
		bounds: "14th to 30th Street, Sixth Avenue to the Hudson",
		h1: ["Chelsea cleaning,", "from walk-up to glass tower."],
		lede:
			"Chelsea has three neighborhoods stacked on top of each other: 1900s tenements and townhouses in the historic district, converted industrial lofts near the galleries, and the glass condos that went up along the High Line. Each one gets dirty differently, and we've cleaned all three this month.",
		buildings: [
			{ title: "Historic-district townhouses and walk-ups", body: "The 20s between Eighth and Tenth: brick row houses, small floor-throughs, steep stairs, radiators and original floors." },
			{ title: "High Line and West Chelsea condos", body: "Floor-to-ceiling glass, open kitchens, pale stone counters. Beautiful, and they show every streak and crumb." },
			{ title: "Converted lofts", body: "Near the galleries on the west side: high ceilings, big windows, exposed pipes that collect dust nobody can reach without a ladder." },
		],
		realities: [
			"West Chelsea is still a construction zone. Fine grey dust drifts in from active sites and settles on sills within days.",
			"Hudson wind pushes grit against west-facing windows and into the tracks. We clean tracks every visit on that side.",
			"Glass condos need streak-free work in raking afternoon light; we do glass and stone last, with the sun in mind.",
			"The 14th Street corridor and 23rd Street traffic leave the same oily film on sills as any avenue.",
		],
		access:
			"Walk-ups: key, lockbox or a neighbor. Condos and rentals: a doorman or virtual doorman and, in many newer buildings, a COI requirement even for rentals; we send it ahead. Loft buildings often have a freight elevator with its own hours.",
		popular: {
			service: "Deep clean, then bi-weekly",
			serviceSlug: "deep-cleaning",
			why: "New Chelsea clients almost always start with a deep clean to get ahead of construction dust and glass, then keep it up bi-weekly. Start a plan and that first deep clean is free.",
			example: "1BR / 1BA: $175 first visit with the free starter deep clean, then $131 per visit bi-weekly.",
		},
		caseStudy: { slug: "three-bedroom-family-reset-west-village", label: "A full reset for a busy family's three-bedroom in the West Village" },
		guide: { slug: "how-nyc-weather-affects-apartment-cleanliness", label: "How NYC weather affects your apartment" },
		faqs: ["What's the difference between a standard and a deep clean?", "Do you offer discounts for recurring cleans?", "Do you bring your own supplies and equipment?", "How long does a clean take?"],
		nearby: ["west-village", "flatiron", "murray-hill"],
	},
	{
		slug: "west-village",
		name: "West Village",
		metaTitle: "West Village Apartment Cleaning — Townhouses & Walk-Ups",
		metaDescription:
			"Apartment cleaning in the West Village: townhouse floor-throughs, tiny walk-ups with odd angles, family apartments on tree-lined streets. Flat rates from $175, same cleaner every visit.",
		bounds: "Houston to 14th Street, Sixth Avenue to the Hudson",
		h1: ["West Village cleaning", "for apartments with character."],
		lede:
			"Nothing in the West Village is square. Stairs turn twice, kitchens were closets, closets were nothing, and the window faces a tree instead of a wall. It's the most pleasant place in Manhattan to clean and the hardest to clean quickly, which is why our cleaners here know the apartments they come back to.",
		buildings: [
			{ title: "Townhouse floor-throughs", body: "One apartment per floor in a 19th-century house: fireplaces that collect soot, plank floors, a garden-level unit with its own damp." },
			{ title: "Small walk-ups", body: "Studios and one-bedrooms on Bedford, Barrow, Grove. Every surface does double duty, so nothing is easy to reach." },
			{ title: "Family apartments", body: "Combined units and the rare elevator building, with kids, dogs and a schedule that leaves no time for cleaning." },
		],
		realities: [
			"Tree-lined streets are lovely and shed constantly: pollen in spring, leaf mold in fall, both through open windows.",
			"Old fireplaces and exposed brick shed fine grit even when unused; we vacuum brick and hearths rather than wiping them.",
			"Garden-level units run damp. Bathroom grout and window sills get a mildew check every visit.",
			"Narrow stairs mean one cleaner with a longer visit works better than two in each other's way.",
		],
		access:
			"Almost no doormen here. Keys, lockboxes and neighbors are the norm, and we treat a key like our own: signed for, never labelled with an address. For the few elevator buildings, we handle the COI and the super.",
		popular: {
			service: "Weekly or bi-weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Families and busy couples here want the apartment kept, not rescued. Weekly at 30% off makes that cheaper per visit than a monthly reset.",
			example: "3BR / 2BA: $300 first visit, $210 per visit weekly, $225 bi-weekly.",
		},
		caseStudy: { slug: "three-bedroom-family-reset-west-village", label: "A full reset for a busy family's three-bedroom in the West Village" },
		guide: { slug: "how-to-clean-pre-war-apartments", label: "How to clean a pre-war apartment" },
		faqs: ["Do I need to be home during the clean?", "Will I get the same cleaner every time?", "Are your products safe for kids and pets?", "How do I cancel or reschedule?"],
		nearby: ["soho", "chelsea", "east-village"],
	},
	{
		slug: "tribeca",
		name: "Tribeca",
		metaTitle: "Tribeca Loft Cleaning — High Ceilings, Big Windows, Detail Work",
		metaDescription:
			"Loft and apartment cleaning in Tribeca: converted industrial buildings, 12-foot ceilings, oversized windows, open kitchens and concrete floors. Flat rates from $175, two-cleaner teams for large lofts.",
		bounds: "Canal to Chambers Street, Broadway to the Hudson",
		h1: ["Tribeca cleaning", "at loft scale."],
		lede:
			"A Tribeca loft is a small apartment's worth of surfaces spread across a big one: forty feet of windows, a kitchen island you could land a plane on, and ceilings that put the dust out of reach. We clean them with the right ladder, the right team size, and a checklist that doesn't stop at eye level.",
		buildings: [
			{ title: "Converted industrial lofts", body: "Cast-iron and brick warehouses turned into open-plan homes. Columns, exposed ducts and pipes, and very few interior walls to break the dust up." },
			{ title: "New full-service condos", body: "Along Greenwich and West Street: doormen, gyms, stone bathrooms and glass everywhere, with COI requirements to match." },
			{ title: "Family lofts", body: "Two- and three-bedroom conversions with kids' zones carved out of the open plan and a lot of floor to keep clean." },
		],
		realities: [
			"Dust settles on top of everything above six feet: ducts, pipes, tall shelving, window heads. We bring a step ladder and an extension duster every visit.",
			"Oversized windows facing the river take wind-driven grit; interior glass is a real job here, not a wipe.",
			"Concrete and wide-plank floors need the right product each; the wrong one leaves a haze you'll see across the whole room.",
			"Open kitchens mean cooking film reaches the living area. We degrease further out than in a closed kitchen.",
		],
		access:
			"Loft buildings usually have a freight elevator with set hours and a super who wants notice; condos have doormen and COIs. We arrange both. For larger lofts we send two cleaners so a deep clean finishes in one visit.",
		popular: {
			service: "Deep clean, two cleaners",
			serviceSlug: "deep-cleaning",
			why: "The scale of a loft means the difference between standard and deep shows more here than anywhere. Most Tribeca clients start deep and hold it bi-weekly.",
			example: "3BR / 2BA loft deep clean: $375 first visit, then $225 per visit bi-weekly.",
		},
		caseStudy: { slug: "loft-detail-clean-tribeca", label: "Detail-cleaning a Tribeca loft: high ceilings, open space, hidden dust" },
		guide: { slug: "how-nyc-weather-affects-apartment-cleanliness", label: "How NYC weather affects your apartment" },
		faqs: ["How long does a clean take?", "What's the difference between a standard and a deep clean?", "What extras can I add?", "What don't you do?"],
		nearby: ["soho", "financial-district", "west-village"],
	},
	{
		slug: "financial-district",
		name: "Financial District",
		metaTitle: "Financial District Apartment Cleaning — FiDi High-Rises",
		metaDescription:
			"Apartment cleaning in the Financial District: converted office towers and new high-rises, doorman buildings, compact one-bedrooms, harbor wind and grit. Flat rates from $175, same-week availability.",
		bounds: "Chambers Street to the Battery, river to river",
		h1: ["FiDi cleaning", "that fits a high-rise schedule."],
		lede:
			"The Financial District turned office towers into apartments faster than anywhere in the city, and it shows in the floor plans: efficient, tall, glassy, and usually occupied by someone who works long hours and wants to come home to done. We work around doormen, package rooms and your calendar.",
		buildings: [
			{ title: "Office-to-residential conversions", body: "Wall Street, Water Street, Broad Street: 1920s and 1960s towers with deep floor plates, interior rooms and big lobby operations." },
			{ title: "New high-rise rentals and condos", body: "Full-service buildings with concierge desks, amenity floors, in-unit laundry and floor-to-ceiling glass facing the harbor." },
			{ title: "Compact one-bedrooms and studios", body: "Smart layouts with little storage, so surfaces stay busy and every clean is really a tidy-and-clean." },
		],
		realities: [
			"Harbor wind carries fine grit and salt onto any window that faces south or west; tracks and sills need real attention.",
			"Deep floor plates mean interior bathrooms with no window and a fan that runs for two minutes; we check grout and ceilings for mildew.",
			"Weekday mornings are quiet here and weekends are quieter; we can usually offer early or late windows other neighborhoods can't.",
			"Package rooms and concierge desks are where the keys live; we're used to signing in and out.",
		],
		access:
			"Nearly every building has a front desk. Leave a key with them or authorize us on the visitor list, and we'll handle the COI for buildings that ask (many rentals here do). Service elevators are standard and usually unrestricted during the day.",
		popular: {
			service: "Bi-weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Long hours and small apartments make a fixed bi-weekly visit the easiest thing to keep up, and the price at 25% off is modest for a one-bedroom.",
			example: "1BR / 1BA: $175 first visit, $131 per visit bi-weekly.",
		},
		caseStudy: { slug: "co-op-coi-cleaning-upper-east-side", label: "Working with doormen and COI requirements: our Upper East Side co-op case study" },
		guide: { slug: "cleaning-services-for-co-ops", label: "Cleaning services for co-ops and condos: what buildings require" },
		faqs: ["How do you handle doormen and key access?", "What days and times do you work?", "How soon can you come?", "When am I charged?"],
		nearby: ["tribeca", "soho", "east-village"],
	},
	{
		slug: "soho",
		name: "SoHo",
		metaTitle: "SoHo Loft & Apartment Cleaning — Cast-Iron Buildings",
		metaDescription:
			"Loft and apartment cleaning in SoHo: cast-iron buildings, live-work lofts, tall windows over Broadway traffic, fifth-floor walk-ups. Flat rates from $175, supplies included, re-clean guarantee.",
		bounds: "Houston to Canal Street, Lafayette to Sixth Avenue",
		h1: ["SoHo cleaning", "for lofts that face the street."],
		lede:
			"SoHo's cast-iron buildings were factories with enormous windows to let the light in. Now they let the Broadway soot in too. Cleaning here is about glass, floors that have seen a century of feet, and the fine black dust that settles on everything within a block of Canal Street.",
		buildings: [
			{ title: "Cast-iron lofts", body: "Broadway, Greene, Mercer, Wooster: tall ceilings, columns, wide-plank or refinished floors, and the biggest windows in Manhattan." },
			{ title: "Walk-up lofts", body: "Plenty of SoHo lofts are still five flights with no elevator. We plan the visit and the supplies around the stairs." },
			{ title: "Live-work spaces", body: "Studios and offices at home mean equipment, cables and paper that have to be worked around, not moved." },
		],
		realities: [
			"Canal and Broadway traffic leave a black, oily film on sills and glass. It needs a degreaser, not a dry cloth.",
			"Tall windows mean tall work; we bring the ladder and do interior glass properly when it's booked as an extra.",
			"Foot traffic below and old floors above: grit tracks in on every shoe, so entryway floors get done twice, first and last.",
			"Retail deliveries start early. If you want a quiet clean, we book mid-morning after the trucks leave.",
		],
		access:
			"A mix of keypad entries, buzzers and keys with a neighbor or the shop downstairs. Elevator buildings often have a freight car with hours; walk-ups just need a key. Few doormen, occasional COIs for condo conversions.",
		popular: {
			service: "Deep clean with interior windows",
			serviceSlug: "deep-cleaning",
			why: "Glass is the job in SoHo. A deep clean with the interior-windows extra resets a loft properly; then a standard bi-weekly keeps the soot from building up.",
			example: "2BR loft deep clean + interior windows: $385 first visit, then $169 per visit bi-weekly.",
		},
		caseStudy: { slug: "loft-detail-clean-tribeca", label: "Detail-cleaning a Tribeca loft: high ceilings, open space, hidden dust" },
		guide: { slug: "how-to-clean-pre-war-apartments", label: "How to clean a pre-war apartment" },
		faqs: ["What extras can I add?", "Do you clean walk-ups and pre-war apartments?", "How long does a clean take?", "What if I'm not happy with the clean?"],
		nearby: ["tribeca", "west-village", "east-village"],
	},
	{
		slug: "murray-hill",
		name: "Murray Hill",
		metaTitle: "Murray Hill Apartment Cleaning — Doorman Rentals & Shares",
		metaDescription:
			"Apartment cleaning in Murray Hill: post-war doorman rentals, white-brick buildings, roommate shares and compact one-bedrooms. Flat rates from $175, bi-weekly plans at 25% off, book in 60 seconds.",
		bounds: "34th to 40th Street, Fifth Avenue to the East River",
		h1: ["Murray Hill cleaning", "for people who are never home."],
		lede:
			"Murray Hill is the neighborhood of first apartments: post-war doorman buildings, roommates splitting a converted two-bedroom, and schedules that run from the office to the gym to dinner. Nobody here has time to clean, and nobody should have to think about it either.",
		buildings: [
			{ title: "Post-war doorman rentals", body: "The white-brick buildings of the 1960s and 70s on Third and Second: compact layouts, parquet floors, small galley kitchens, through-wall AC units." },
			{ title: "Roommate shares", body: "Flex walls and converted living rooms. Shared bathrooms and kitchens get used by three people, which changes what needs attention." },
			{ title: "Newer towers by the river", body: "Full-service high-rises east of Second with in-unit laundry and glass facing the East River." },
		],
		realities: [
			"Through-wall AC units are dust factories. Vents and the wall around them get wiped every visit.",
			"Parquet floors scratch under grit; we vacuum before we mop, always.",
			"Small galley kitchens with three cooks mean the stovetop and backsplash need degreasing every time, not just on deep cleans.",
			"Shared bathrooms: one visit every two weeks is the minimum that keeps grout honest.",
		],
		access:
			"Doorman buildings almost everywhere. Leave a key at the desk or add us to the list, and we'll send a COI if the management office asks. For shares, one person books and the rest can text us directly; the card on file is charged after each visit.",
		popular: {
			service: "Bi-weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Split three ways, a bi-weekly clean at 25% off costs less than a round of drinks each, and the apartment never gets to the point where nobody wants to deal with it.",
			example: "2BR / 1BA share: $225 first visit, $169 per visit bi-weekly.",
		},
		caseStudy: { slug: "co-op-coi-cleaning-upper-east-side", label: "Working with doormen and management: our Upper East Side case study" },
		guide: { slug: "how-nyc-weather-affects-apartment-cleanliness", label: "How NYC weather affects your apartment" },
		faqs: ["Do you offer discounts for recurring cleans?", "How do you handle doormen and key access?", "When am I charged?", "How do I cancel or reschedule?"],
		nearby: ["flatiron", "upper-east-side", "chelsea"],
	},
	{
		slug: "east-village",
		name: "East Village",
		metaTitle: "East Village Apartment Cleaning — Tenement Walk-Ups Done Right",
		metaDescription:
			"Apartment cleaning in the East Village: tenement walk-ups, railroad layouts, small bathrooms, steam heat and pets. Flat rates from $175, eco-friendly supplies, same cleaner every visit.",
		bounds: "Houston to 14th Street, the Bowery to the East River",
		h1: ["East Village cleaning", "for real New York apartments."],
		lede:
			"The East Village is tenement country: five-story walk-ups, railroad apartments where you walk through one room to reach the next, bathrooms the size of a phone booth and a radiator that clanks at 6am. We love these apartments. They also need a cleaner who knows what they're doing.",
		buildings: [
			{ title: "Tenement walk-ups", body: "Avenue A to D and the side streets: 1900s buildings, four or five flights, small rooms, tin ceilings if you're lucky." },
			{ title: "Railroad apartments", body: "Rooms in a line with no hallway. Every room is a walkway, so floors take more traffic than the square footage suggests." },
			{ title: "Newer infill buildings", body: "Elevator rentals and condos on the avenues and along Houston, often with a virtual doorman and a package room." },
		],
		realities: [
			"Small bathrooms with no ventilation: grout, ceilings and shower curtains need a mildew check every visit.",
			"Steam radiators in every room, usually under a window, usually behind furniture; we move what moves and reach what doesn't.",
			"Dogs and cats are everywhere. We vacuum upholstery and under furniture for hair, and use pet-safe products by default.",
			"Fire-escape windows get street dust and pigeon grit; the sill gets a real wipe, not a dust.",
		],
		access:
			"Keys, lockboxes, buzzers and neighbors. Very few doormen. We'll text when we're on the way, when we arrive, and when we're done, and send a photo summary, so you don't have to be there to know it happened.",
		popular: {
			service: "Bi-weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "Small apartments get messy fast and clean fast. A bi-weekly visit at 25% off keeps a one-bedroom genuinely clean for less than $135 a visit.",
			example: "1BR / 1BA: $175 first visit, $131 per visit bi-weekly.",
		},
		caseStudy: { slug: "pre-war-walk-up-deep-clean-upper-west-side", label: "Deep-cleaning a pre-war walk-up studio (our Upper West Side case study)" },
		guide: { slug: "how-to-clean-pre-war-apartments", label: "How to clean a pre-war apartment" },
		faqs: ["Do you clean walk-ups and pre-war apartments?", "Are your products safe for kids and pets?", "Do I need to be home during the clean?", "How much does a cleaning cost?"],
		nearby: ["west-village", "soho", "financial-district"],
	},
	{
		slug: "flatiron",
		name: "Flatiron & NoMad",
		metaTitle: "Flatiron & NoMad Apartment Cleaning — Lofts Above the Avenue",
		metaDescription:
			"Apartment cleaning in Flatiron and NoMad: converted lofts above retail, new luxury condos, home offices. Flat rates from $175, cleans scheduled around your work-from-home day.",
		bounds: "14th to 30th Street, Park Avenue South to Sixth Avenue",
		h1: ["Flatiron cleaning,", "scheduled around your workday."],
		lede:
			"Flatiron and NoMad apartments sit above the busiest retail blocks in the city and, more than anywhere else we work, double as offices. That means cleaning around a desk that's in use, windows that face Broadway, and a schedule that has to fit between calls.",
		buildings: [
			{ title: "Lofts above retail", body: "Broadway, Fifth and the 20s: former showrooms and manufacturing floors with high ceilings, big windows and elevators that open into the apartment." },
			{ title: "New condos and conversions", body: "Madison Square Park and NoMad towers with concierge desks, stone bathrooms and floor-to-ceiling glass." },
			{ title: "Home offices", body: "Two monitors on the dining table, a standing desk in the bedroom. We clean around working setups without unplugging anything." },
		],
		realities: [
			"Broadway and Fifth Avenue traffic and construction put a constant film on street-facing glass and sills.",
			"Madison Square Park's trees do the same thing Central Park's do: pollen in April, leaf litter in October, through any open window.",
			"Home offices collect a specific dust: cables, monitor backs, keyboards. We dust electronics dry and never spray them.",
			"Many buildings have retail below and deliveries early; mid-morning and afternoon windows are quietest.",
		],
		access:
			"Concierge and doorman buildings send us to the service elevator and may ask for a COI; loft buildings have a freight car with hours and a super who likes notice. If you're working from home, tell us the calls to avoid and we'll work room to room around you.",
		popular: {
			service: "Weekly standard clean",
			serviceSlug: "apartment-cleaning",
			why: "If you're home all day, you notice the apartment all day. Weekly at 30% off is the plan most work-from-home clients here settle into.",
			example: "1BR / 1BA: $175 first visit, $123 per visit weekly.",
		},
		caseStudy: { slug: "loft-detail-clean-tribeca", label: "Detail-cleaning a Tribeca loft: high ceilings, open space, hidden dust" },
		guide: { slug: "fall-cleaning-checklist-manhattan-apartment", label: "The fall reset: what to clean before the heat comes on" },
		faqs: ["Do I need to be home during the clean?", "What days and times do you work?", "Do you offer discounts for recurring cleans?", "How soon can you come?"],
		nearby: ["chelsea", "murray-hill", "west-village"],
	},
];
