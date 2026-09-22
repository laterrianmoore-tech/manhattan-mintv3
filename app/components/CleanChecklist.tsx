"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Room-by-room checklist for the three service levels, transcribed from the
// owner's printed checklists (Sept 2026). Each item names the FIRST tier that
// includes it; higher tiers include everything below them.
type Tier = "Standard" | "Deep Clean" | "Move Out";
const TIERS: { key: Tier; label: string; price: string; blurb: string; homeService: string }[] = [
	{ key: "Standard", label: "Standard Clean", price: "from $175", blurb: "Every room, every visit. The clean most clients book weekly or biweekly.", homeService: "Standard clean" },
	{ key: "Deep Clean", label: "Deep Clean", price: "+$75", blurb: "Standard plus baseboards, door frames, grout and the places a weekly clean skips.", homeService: "Deep clean (+$75)" },
	{ key: "Move Out", label: "Move In / Move Out", price: "+$100", blurb: "Deep clean plus inside the fridge, oven, cabinets and closets. Ready for keys.", homeService: "Move-in / Move-out (+$100)" },
];
const RANK: Record<Tier, number> = { Standard: 0, "Deep Clean": 1, "Move Out": 2 };

type Item = { text: string; tier: Tier };
const ROOMS: { room: string; items: Item[] }[] = [
	{
		room: "Bedrooms & living areas",
		items: [
			{ text: "Cobwebs cleared, shelves and pictures dusted", tier: "Standard" },
			{ text: "Ceiling fans and blades dusted", tier: "Standard" },
			{ text: "Mirrors cleaned and buffed", tier: "Standard" },
			{ text: "Furniture, lamps, lamp shades and hanging lights dusted", tier: "Standard" },
			{ text: "Window sills, window frames and chair rails cleaned", tier: "Standard" },
			{ text: "Knick knacks and personal items dusted and tidied", tier: "Standard" },
			{ text: "Floors vacuumed and mopped, corners and edges included", tier: "Standard" },
			{ text: "Light switches and door knobs cleaned", tier: "Standard" },
			{ text: "Beds made, blankets folded, pillows arranged", tier: "Standard" },
			{ text: "Garbage emptied and bag replaced", tier: "Standard" },
			{ text: "Baseboards dusted and wiped down", tier: "Deep Clean" },
			{ text: "Doors and door frames dusted", tier: "Deep Clean" },
			{ text: "Doors and door frames wiped down", tier: "Move Out" },
			{ text: "Window sills, blinds and frames wet-wiped", tier: "Move Out" },
			{ text: "Inside linen closets and shelves cleaned", tier: "Move Out" },
		],
	},
	{
		room: "Bathrooms",
		items: [
			{ text: "Cobwebs cleared, shelves dusted", tier: "Standard" },
			{ text: "Mirrors and glass cleaned and buffed", tier: "Standard" },
			{ text: "Counter tops cleaned", tier: "Standard" },
			{ text: "Towel racks and toilet paper holder polished", tier: "Standard" },
			{ text: "Light fixtures dusted, sinks cleaned", tier: "Standard" },
			{ text: "Shower door, track and glass cleaned and dried", tier: "Standard" },
			{ text: "Personal items and hand towels tidied", tier: "Standard" },
			{ text: "Sink counters and soap dish cleaned and dried", tier: "Standard" },
			{ text: "Toilet cleaned inside and out, base and lid included", tier: "Standard" },
			{ text: "Floors swept, vacuumed and mopped, corners and edges included", tier: "Standard" },
			{ text: "Window sills and frames dusted", tier: "Standard" },
			{ text: "Cabinet fronts cleaned", tier: "Standard" },
			{ text: "Garbage emptied and bag replaced", tier: "Standard" },
			{ text: "Tile grout scrubbed", tier: "Deep Clean" },
			{ text: "Inside linen closet and shelves cleaned", tier: "Deep Clean" },
			{ text: "Doors and door frames dusted", tier: "Deep Clean" },
			{ text: "Baseboards dusted and wiped down", tier: "Deep Clean" },
			{ text: "Inside cabinets cleaned", tier: "Move Out" },
			{ text: "Inside medicine cabinet cleaned", tier: "Move Out" },
			{ text: "Windowsills and blinds wet-wiped", tier: "Move Out" },
			{ text: "Doors and door frames wiped down", tier: "Move Out" },
		],
	},
	{
		room: "Kitchen",
		items: [
			{ text: "Dishes gathered and loaded into the dishwasher where possible", tier: "Standard" },
			{ text: "Cobwebs cleared from lights and sills", tier: "Standard" },
			{ text: "Counter tops and backsplash cleaned", tier: "Standard" },
			{ text: "Lights, ceiling fans and blades dusted", tier: "Standard" },
			{ text: "Windows, sills and ledges dusted", tier: "Standard" },
			{ text: "Table and chairs cleaned", tier: "Standard" },
			{ text: "Microwave cleaned inside and out", tier: "Standard" },
			{ text: "Stove burners, stovetop, front and control panels cleaned", tier: "Standard" },
			{ text: "Sink, sink counters and soap dish cleaned and dried", tier: "Standard" },
			{ text: "Floors swept, mopped and vacuumed", tier: "Standard" },
			{ text: "Cabinet fronts and handles cleaned", tier: "Standard" },
			{ text: "Trash taken out, garbage bag replaced", tier: "Standard" },
			{ text: "Oven hood vent cleaned", tier: "Deep Clean" },
			{ text: "Window sills and frames wiped down", tier: "Deep Clean" },
			{ text: "Doors and door frames dusted", tier: "Deep Clean" },
			{ text: "Baseboards dusted and wiped down", tier: "Deep Clean" },
			{ text: "Light switches and door knobs disinfected", tier: "Deep Clean" },
			{ text: "Inside refrigerator cleaned", tier: "Move Out" },
			{ text: "Inside oven cleaned", tier: "Move Out" },
			{ text: "Inside cabinets and drawers cleaned", tier: "Move Out" },
			{ text: "Pantry floor swept and shelves wiped", tier: "Move Out" },
			{ text: "Doors and door frames wiped down", tier: "Move Out" },
			{ text: "Blinds and shutters wet-wiped", tier: "Move Out" },
		],
	},
];

export default function CleanChecklist() {
	const router = useRouter();
	const [tier, setTier] = useState<Tier>("Standard");
	const current = TIERS.find((t) => t.key === tier)!;

	const book = () => {
		try {
			localStorage.setItem("mm_service", current.homeService);
		} catch {
			/* private mode */
		}
		router.push("/quote");
	};

	return (
		<section className="section section-white" id="checklist">
			<div className="sect-eye">What each clean includes</div>
			<h2>Standard, Deep, or Move Out.<br /><em>Here&apos;s the difference.</em></h2>
			<p className="sect-sub">Pick a level to see exactly what your cleaner works through, room by room. Anything greyed out is included in the higher level.</p>

			<div className="ck-tabs" role="tablist" aria-label="Service level">
				{TIERS.map((t) => (
					<button
						key={t.key}
						role="tab"
						type="button"
						aria-selected={tier === t.key}
						className={`ck-tab${tier === t.key ? " active" : ""}`}
						onClick={() => setTier(t.key)}
					>
						<span className="ck-tab-label">{t.label}</span>
						<span className="ck-tab-price">{t.price}</span>
					</button>
				))}
			</div>
			<p className="ck-blurb">{current.blurb}</p>

			<div className="ck-grid">
				{ROOMS.map((r) => (
					<div className="ck-room" key={r.room}>
						<h3 className="ck-room-title">{r.room}</h3>
						<ul className="ck-list">
							{r.items.map((item) => {
								const included = RANK[item.tier] <= RANK[tier];
								return (
									<li key={item.text} className={`ck-item${included ? "" : " ck-item-off"}`}>
										<span className={`ck-mark${included ? " on" : ""}`} aria-hidden="true">
											{included ? (
												<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
											) : null}
										</span>
										<span className="ck-text">{item.text}</span>
										{!included ? <span className="ck-tag">{item.tier}</span> : null}
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>

			<div className="ck-cta">
				<button type="button" className="btn-pcb" onClick={book}>
					Book a {current.label} →
				</button>
				<span className="ck-fine">All supplies included. Photo summary after every visit. 100% re-clean guarantee.</span>
			</div>
		</section>
	);
}
