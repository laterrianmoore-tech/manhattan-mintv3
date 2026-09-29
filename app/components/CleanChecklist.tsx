"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TIERS, RANK, ROOMS, type Tier } from "./checklist-data";

// Points per level = every item at that level or below (Deep Clean includes
// Standard, Move Out includes both). Computed from ROOMS so it never drifts.

const counts = (Object.keys(RANK) as Tier[]).reduce((acc, level) => {
	acc[level] = ROOMS.flatMap((r) => r.items).filter((i) => RANK[i.tier] <= RANK[level]).length;
	return acc;
}, {} as Record<Tier, number>);

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
			<div className="sect-eye">The Mint Mark checklist</div>
			<h2>Every clean earns<br /><em>the Mint Mark.</em></h2>
			<p className="sect-sub">A mint mark is the small stamp that proves where a coin was made. Ours is the checklist of {counts["Move Out"]} details every cleaner works through, room by room &mdash; {counts.Standard} on a Standard clean, {counts["Deep Clean"]} on a Deep Clean, all {counts["Move Out"]} on a Move Out. Pick a level to see exactly what&apos;s covered; anything greyed out is included in the higher level.</p>

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
						<span className="ck-tab-price">{counts[t.key]} details · {t.price}</span>
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
