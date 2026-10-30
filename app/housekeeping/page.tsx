import type { Metadata } from "next";
import Link from "next/link";
import HousekeepingForm from "./HousekeepingForm";

// Recurring housekeeping (2026-10-30): light-touch visits two to five times
// a week for someone recovering from surgery, a busy household, or an
// elderly parent. Quoted by the owner per home, never booked straight from
// the site: the form posts to /api/housekeeping/request, which emails and
// texts him. The first visit is a standard clean at the flat rate with the
// deep clean included; follow-ups start at FROM_PER_VISIT. Change the
// numbers here and in 01_Foundational_Docs/DECISIONS-LOG.md.
const FROM_PER_VISIT = 80;
const FIRST_VISIT_FROM = 175;

export const metadata: Metadata = {
	title: "Recurring Housekeeping in Manhattan — 2 to 5 Visits a Week",
	description:
		`Light housekeeping visits two to five times a week in Manhattan: beds, laundry, dishes, bathrooms and tidying by the same cleaner. From $${FROM_PER_VISIT} a visit, quoted per home. Ideal after surgery, for busy households and for a parent who needs a hand.`,
	alternates: { canonical: "/housekeeping" },
};

export default function HousekeepingPage() {
	return (
		<>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
			:root { --mint: #1D9E75; --mint-dark: #157a5a; --mint-light: #E8F5F0; --dark: #0F0F0F; --gray: #777; --soft: #F8F8F6; }
			.hk-page { min-height: 100vh; background: var(--soft); color: var(--dark); font-family: 'DM Sans', sans-serif; }
			.hk-wrap { max-width: 1080px; margin: 0 auto; padding: 4rem 1rem 6rem; }
			.hk-back { color: var(--mint); text-decoration: none; font-size: .9rem; font-weight: 500; }
			.hk-back:hover { text-decoration: underline; }
			.hk-eye { color: var(--mint); letter-spacing: .12em; text-transform: uppercase; font-size: .72rem; margin: 2rem 0 .6rem; }
			.hk-h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(2rem, 4.5vw, 3.1rem); line-height: 1.1; margin: 0 0 1rem; }
			.hk-h1 em { font-style: italic; color: var(--mint-dark); }
			.hk-lead { font-size: 1.1rem; font-weight: 300; color: #333; line-height: 1.6; margin: 0 0 2rem; max-width: 620px; }
			.hk-grid { display: grid; gap: 2rem; grid-template-columns: 1fr; align-items: start; }
			@media (min-width: 900px) { .hk-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 480px); } }
			.hk-price-row { display: grid; gap: .8rem; grid-template-columns: 1fr; margin: 0 0 .9rem; }
			@media (min-width: 520px) { .hk-price-row { grid-template-columns: 1fr 1fr; } }
			.hk-price { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.2rem 1.1rem; }
			.hk-price .sz { font-size: .8rem; color: var(--gray); letter-spacing: .02em; margin-bottom: .35rem; }
			.hk-price .amt { font-family: 'DM Serif Display', serif; font-size: 2.2rem; line-height: 1; color: var(--dark); }
			.hk-price .amt small { font-family: 'DM Sans', sans-serif; font-size: .78rem; color: var(--gray); margin-left: .3rem; white-space: nowrap; }
			.hk-price .amt .from { font-family: 'DM Sans', sans-serif; font-size: .95rem; font-weight: 300; color: var(--gray); margin-right: .3rem; }
			.hk-price .note { font-size: .82rem; color: #555; margin-top: .5rem; line-height: 1.5; }
			.hk-fine { color: var(--gray); font-size: .84rem; line-height: 1.6; margin: 0 0 1.6rem; }
			.hk-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.4rem 1.5rem; margin-bottom: 1rem; }
			.hk-card h2 { font-size: 1.15rem; margin: 0 0 .6rem; }
			.hk-card p { margin: 0; color: #444; line-height: 1.6; font-size: .95rem; }
			.hk-list { margin: .4rem 0 0; padding-left: 1.1rem; color: #444; line-height: 1.65; font-size: .95rem; }
			.hk-list li { margin-bottom: .2rem; }
			.hk-for { display: grid; gap: .6rem; grid-template-columns: 1fr; margin: .4rem 0 0; }
			@media (min-width: 520px) { .hk-for { grid-template-columns: 1fr 1fr; } }
			.hk-for div { background: var(--mint-light); border-radius: 10px; padding: .7rem .85rem; font-size: .9rem; color: #2b3b35; line-height: 1.5; }
			.hk-for strong { display: block; color: var(--mint-dark); font-weight: 600; margin-bottom: .1rem; }
			.hk-quote { border-left: 3px solid var(--mint); padding: .2rem 0 .2rem 1rem; color: #333; font-style: italic; margin: 1.5rem 0; line-height: 1.6; }
			.hk-form { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 18px; padding: 1.6rem; box-shadow: 0 24px 60px rgba(8,80,65,.08); position: sticky; top: 6.5rem; }
			.hk-form h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 1.5rem; margin: 0 0 .25rem; }
			.hk-form-sub { margin: 0 0 1rem; color: var(--gray); font-size: .9rem; }
			.hk-row { display: grid; gap: .8rem; grid-template-columns: 1fr; }
			@media (min-width: 480px) { .hk-row { grid-template-columns: 1fr 1fr; } .hk-row-3 { grid-template-columns: 1fr 1fr 1fr; } }
			.hk-field { display: grid; gap: .3rem; margin-bottom: .9rem; border: 0; padding: 0; min-width: 0; }
			.hk-field label, .hk-field legend { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: #666; }
			.hk-field legend { padding: 0; margin-bottom: .3rem; }
			.hk-field input, .hk-field select, .hk-field textarea { border: 1px solid rgba(0,0,0,.15); border-radius: 10px; padding: .75rem .85rem; font: inherit; font-size: .95rem; background: #fff; width: 100%; }
			.hk-field input:focus, .hk-field select:focus, .hk-field textarea:focus { outline: none; border-color: var(--mint); box-shadow: 0 0 0 3px rgba(29,158,117,.15); }
			.hk-check-grid { display: grid; gap: .4rem .8rem; grid-template-columns: 1fr; }
			@media (min-width: 480px) { .hk-check-grid { grid-template-columns: 1fr 1fr; } }
			.hk-field .hk-check { display: flex; align-items: center; gap: .5rem; font-size: .9rem; color: #333; text-transform: none; letter-spacing: 0; cursor: pointer; }
			.hk-check input { width: auto; accent-color: var(--mint); margin: 0; }
			.hk-submit { width: 100%; border: none; border-radius: 12px; background: var(--mint); color: #fff; padding: .95rem 1rem; font: inherit; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: .2rem; }
			.hk-submit:hover { background: var(--mint-dark); }
			.hk-submit:disabled { opacity: .7; cursor: wait; }
			.hk-form .hk-fine { margin: .8rem 0 0; font-size: .78rem; }
			.hk-form .hk-fine a { color: var(--mint-dark); }
			.hk-error { color: #b42318; font-size: .88rem; margin: .6rem 0 0; }
			.hk-sent { text-align: center; padding: 2.4rem 1.4rem; }
			.hk-sent .big { font-size: 2.2rem; color: var(--mint); margin-bottom: .6rem; }
			.hk-sent p { color: #444; line-height: 1.6; font-size: .95rem; }
			.hk-sent a { color: var(--mint-dark); }
			.hk-hp { position: absolute; left: -9999px; }
			`}</style>

			<div className="hk-page">
				<div className="hk-wrap">
					<Link href="/" className="hk-back">← Manhattan Mint</Link>

					<p className="hk-eye">Recurring housekeeping · 2 to 5 visits a week</p>
					<h1 className="hk-h1">
						A hand around the house,<br />
						<em>a few times a week.</em>
					</h1>
					<p className="hk-lead">
						Shorter, more frequent visits that keep a home running: beds made, laundry put away, dishes done, bathrooms fresh.
						The same cleaner each time, on the days you choose, for as long as you need. Quoted per home, so tell us a little
						about the place and we&apos;ll come back with a price and the days we can hold.
					</p>

					<div className="hk-grid">
						<div>
							<div className="hk-price-row">
								<div className="hk-price">
									<div className="sz">Each housekeeping visit</div>
									<div className="amt"><span className="from">from</span>${FROM_PER_VISIT}<small>per visit</small></div>
									<div className="note">Usually one to two hours. Two visits a week from ${FROM_PER_VISIT * 2}, three from ${FROM_PER_VISIT * 3}.</div>
								</div>
								<div className="hk-price">
									<div className="sz">First visit · full reset</div>
									<div className="amt"><span className="from">from</span>${FIRST_VISIT_FROM}<small>flat</small></div>
									<div className="note">A proper clean of the whole apartment so the visits that follow only have to keep it that way. Deep clean included for first-time clients.</div>
								</div>
							</div>
							<p className="hk-fine">
								Final price depends on the size of the home and what each visit covers. No contract; stop or change the days whenever you like.
								Manhattan only.
							</p>

							<div className="hk-card">
								<h2>What a visit covers</h2>
								<ul className="hk-list">
									<li>Bathrooms and kitchen cleaned, counters and surfaces wiped</li>
									<li>Bed made, sheets changed on the schedule you set</li>
									<li>Laundry washed, folded and put away (in-unit or building laundry room)</li>
									<li>Dishes done, dishwasher run and emptied</li>
									<li>General tidying, trash and recycling out</li>
									<li>Anything else you add to the list, within reason</li>
								</ul>
								<p style={{ marginTop: ".8rem", fontSize: ".88rem", color: "var(--gray)" }}>
									Cleaning only: no cooking, errands or personal care.
								</p>
							</div>

							<div className="hk-card">
								<h2>Who it&apos;s for</h2>
								<div className="hk-for">
									<div><strong>Recovering from surgery</strong>Can&apos;t bend, lift or stand for long. We keep walkways clear and the place in order while you heal.</div>
									<div><strong>A parent who needs a hand</strong>Regular visits from one familiar face, with a text to you after each one if you&apos;d like.</div>
									<div><strong>New baby, no time</strong>Laundry, bottles, surfaces and floors handled a few mornings a week.</div>
									<div><strong>Busy households</strong>Two working parents, kids, a dog. Weeknight chaos kept to a minimum.</div>
								</div>
							</div>

							<blockquote className="hk-quote">
								Booking on behalf of a family member, a client or your boss? Send the request and we&apos;ll email you a summary you can
								forward, then coordinate directly with whoever is at home once you&apos;re ready.
							</blockquote>

							<p className="hk-fine" style={{ marginTop: "1rem" }}>
								Just want a regular clean every week or two? That books instantly on the{" "}
								<Link href="/quote" style={{ color: "var(--mint)" }}>quote page</Link>. Managing furnished units?
								See <Link href="/turnovers" style={{ color: "var(--mint)" }}>turnovers</Link>.
							</p>
						</div>

						<HousekeepingForm />
					</div>
				</div>
			</div>
		</>
	);
}
