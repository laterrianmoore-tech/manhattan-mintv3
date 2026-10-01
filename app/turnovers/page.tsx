import type { Metadata } from "next";
import Link from "next/link";

// Turnover cleaning for operators: furnished rentals, corporate housing,
// coliving, 30+ day rental managers. This is the priced product every B2B
// email links to. Prices are the owner's to set; change them here and in
// 05_Marketing_and_Sales/outbound-b2b-week1-2026-09-18.md (CONFIRMED DECISIONS).
const TURNOVER_PRICES = [
	{ size: "Studio / 1 bedroom", price: 149 },
	{ size: "2 bedrooms", price: 199 },
	{ size: "3 bedrooms", price: 249 },
];
const ADD_ONS = [
	{ name: "Linen wash and dry on site", price: 40, note: "Started on arrival, folded or re-made before we leave." },
	{ name: "Inside the fridge", price: 45, note: "Emptied, shelves washed, expired items out." },
	{ name: "Deep reset between long stays", price: 75, note: "Oven interior, behind and under what moves, grout and vents." },
	{ name: "Key pickup and return", price: 25, note: "From your office or lockbox, back the same day." },
];
const VOLUME_DISCOUNT = 10;

export const metadata: Metadata = {
	title: "Turnover Cleaning for Furnished Rentals & Corporate Housing — Manhattan",
	description:
		"Turnover cleaning for furnished apartments, corporate housing and coliving units in Manhattan. Priced per unit from $149, next-day standard, same-day when booked before 10am. First turnover free.",
	alternates: { canonical: "/turnovers" },
};

const MAIL_SUBJECT = encodeURIComponent("Turnovers: free first unit");
const MAIL_BODY = encodeURIComponent(
	"Hi Manhattan Mint,\n\nWe manage furnished units in Manhattan and would like to try the free first turnover.\n\nCompany: [name]\nUnits in Manhattan: [count, neighborhoods]\nA unit turning over soon: [address, size, date]\nBest contact: [name, cell]\n\nThanks,\n[name]",
);

export default function TurnoversPage() {
	return (
		<>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
			:root { --mint: #1D9E75; --mint-dark: #157a5a; --mint-light: #E8F5F0; --dark: #0F0F0F; --gray: #777; --soft: #F8F8F6; }
			.to-page { min-height: 100vh; background: var(--soft); color: var(--dark); font-family: 'DM Sans', sans-serif; }
			.to-wrap { max-width: 820px; margin: 0 auto; padding: 4rem 1rem 6rem; }
			.to-back { color: var(--mint); text-decoration: none; font-size: .9rem; font-weight: 500; }
			.to-back:hover { text-decoration: underline; }
			.to-eye { color: var(--mint); letter-spacing: .12em; text-transform: uppercase; font-size: .72rem; margin: 2rem 0 .6rem; }
			.to-h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(2rem, 4.5vw, 3.1rem); line-height: 1.1; margin: 0 0 1rem; }
			.to-h1 em { font-style: italic; color: var(--mint-dark); }
			.to-lead { font-size: 1.1rem; font-weight: 300; color: #333; line-height: 1.6; margin: 0 0 2rem; max-width: 640px; }
			.to-price-grid { display: grid; gap: .8rem; grid-template-columns: 1fr; margin: 0 0 .9rem; }
			@media (min-width: 560px) { .to-price-grid { grid-template-columns: repeat(3, 1fr); } }
			.to-price { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.2rem 1.1rem; }
			.to-price .sz { font-size: .8rem; color: var(--gray); letter-spacing: .02em; margin-bottom: .35rem; }
			.to-price .amt { font-family: 'DM Serif Display', serif; font-size: 2.2rem; line-height: 1; color: var(--dark); }
			.to-price .amt small { font-family: 'DM Sans', sans-serif; font-size: .78rem; color: var(--gray); margin-left: .3rem; }
			.to-fine { color: var(--gray); font-size: .84rem; line-height: 1.6; margin: 0 0 2rem; }
			.to-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.4rem 1.5rem; margin-bottom: 1rem; }
			.to-card h2 { font-size: 1.15rem; margin: 0 0 .6rem; }
			.to-card p { margin: 0; color: #444; line-height: 1.6; font-size: .95rem; }
			.to-list { margin: .4rem 0 0; padding-left: 1.1rem; color: #444; line-height: 1.65; font-size: .95rem; }
			.to-list li { margin-bottom: .2rem; }
			.to-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; margin: 1.2rem 0 1rem; }
			@media (min-width: 640px) { .to-grid { grid-template-columns: 1fr 1fr; } }
			.to-addon { display: flex; justify-content: space-between; gap: 1rem; padding: .7rem 0; border-bottom: 1px solid rgba(0,0,0,.07); font-size: .95rem; }
			.to-addon:last-child { border-bottom: 0; }
			.to-addon strong { font-weight: 500; display: block; }
			.to-addon span { color: var(--gray); font-size: .84rem; }
			.to-addon em { font-style: normal; font-weight: 600; color: var(--mint-dark); white-space: nowrap; }
			.to-cta { background: var(--dark); color: #fff; border-radius: 14px; padding: 1.7rem 1.5rem; margin-top: 2rem; }
			.to-cta h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 1.7rem; margin: 0 0 .6rem; }
			.to-cta h2 em { font-style: italic; color: #7fd6b8; }
			.to-cta p { color: rgba(255,255,255,.8); margin: 0 0 1.1rem; line-height: 1.6; }
			.to-btns { display: flex; flex-wrap: wrap; gap: .7rem; }
			.to-btn { display: inline-block; text-decoration: none; border-radius: 10px; padding: .75rem 1.1rem; font-weight: 500; font-size: .95rem; }
			.to-btn-primary { background: var(--mint); color: #fff; }
			.to-btn-secondary { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.35); }
			.to-quote { border-left: 3px solid var(--mint); padding: .2rem 0 .2rem 1rem; color: #333; font-style: italic; margin: 1.5rem 0; }
			`}</style>

			<div className="to-page">
				<div className="to-wrap">
					<Link href="/" className="to-back">← Manhattan Mint</Link>

					<p className="to-eye">Turnover cleaning · furnished rentals, corporate housing, coliving</p>
					<h1 className="to-h1">
						Turnovers priced like a product.<br />
						<em>Not a quote you have to chase.</em>
					</h1>
					<p className="to-lead">
						One price per unit, supplies and a photo report included, next-day as standard. The first turnover is free
						on a unit of your choice, so your team judges the work before anything else.
					</p>

					<p className="to-eye" style={{ marginTop: 0 }}>Per unit, per turnover</p>
					<div className="to-price-grid">
						{TURNOVER_PRICES.map((p) => (
							<div className="to-price" key={p.size}>
								<div className="sz">{p.size}</div>
								<div className="amt">${p.price}<small>flat</small></div>
							</div>
						))}
					</div>
					<p className="to-fine">
						Four or more bedrooms quoted per unit. {VOLUME_DISCOUNT}% off the table at eight or more turnovers a month,
						invoiced monthly. Manhattan only.
					</p>

					<div className="to-grid">
						<div className="to-card">
							<h2>What a turnover includes</h2>
							<ul className="to-list">
								<li>The full Mint Mark standard checklist, every room</li>
								<li>Beds made with the linens you leave out</li>
								<li>Trash and recycling out, dishwasher run and emptied</li>
								<li>Restock check against your list, with what is missing in the report</li>
								<li>Before and after photos in one thread per unit</li>
								<li>Same cleaner on your account whenever the schedule allows</li>
							</ul>
						</div>
						<div className="to-card">
							<h2>Timing</h2>
							<p>
								Next-day is standard. Same-day when booked before 10am, subject to availability. Seven days a week,
								including the Sunday-afternoon checkout nobody wants.
							</p>
							<h2 style={{ marginTop: "1.1rem" }}>Buildings</h2>
							<p>
								Certificate of insurance on request, doorman check-ins and service-elevator reservations handled. $1M
								per occurrence / $2M aggregate general liability.
							</p>
						</div>
					</div>

					<div className="to-card">
						<h2>Add-ons, when a unit needs them</h2>
						{ADD_ONS.map((a) => (
							<div className="to-addon" key={a.name}>
								<div>
									<strong>{a.name}</strong>
									<span>{a.note}</span>
								</div>
								<em>+${a.price}</em>
							</div>
						))}
					</div>

					<blockquote className="to-quote">
						One point of contact: you text the owner, not an inbox. He reviews every unit&apos;s photo set before the job
						closes, and a missed detail is re-done free.
					</blockquote>

					<div className="to-cta">
						<h2>Start with one unit. <em>On us.</em></h2>
						<p>
							Send the address, the size and the next checkout date. We confirm the same day and you judge the work
							before anything is invoiced.
						</p>
						<div className="to-btns">
							<a className="to-btn to-btn-primary" href={`mailto:hello@manhattanmintnyc.com?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`}>
								Email hello@manhattanmintnyc.com
							</a>
							<a className="to-btn to-btn-secondary" href="sms:+19148637902">Text (914) 863-7902</a>
						</div>
					</div>

					<p className="to-fine" style={{ marginTop: "1.5rem" }}>
						Real estate agent or rental broker? The <Link href="/brokers" style={{ color: "var(--mint)" }}>partner offer for brokers</Link> is
						a different page. Residential clients book on the <Link href="/quote" style={{ color: "var(--mint)" }}>quote page</Link>.
					</p>
				</div>
			</div>
		</>
	);
}
