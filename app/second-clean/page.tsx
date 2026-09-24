import Link from "next/link";
import { SECOND_PROMO_CODE, SECOND_WINDOW_DAYS } from "@/lib/referral";

// Google Ads landing page. One offer, one button. The code is carried into the
// quote page through the URL so nobody has to type it.
const BOOK_HREF = `/quote/?code=${SECOND_PROMO_CODE}`;

export default function SecondCleanPage() {
	return (
		<>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
			:root { --mint: #1D9E75; --mint-dark: #157a5a; --mint-light: #E8F5F0; --dark: #0F0F0F; --gray: #777; --soft: #F8F8F6; }
			.sc-page { min-height: 100vh; background: var(--soft); color: var(--dark); font-family: 'DM Sans', sans-serif; }
			.sc-hero { background: var(--dark); color: #fff; padding: 4.5rem 1rem 3.5rem; }
			.sc-wrap { max-width: 760px; margin: 0 auto; }
			.sc-eye { color: #7ed9b8; letter-spacing: .14em; text-transform: uppercase; font-size: .72rem; font-weight: 500; margin: 0 0 1rem; }
			.sc-h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(2.3rem, 6vw, 4rem); line-height: 1.05; margin: 0 0 1.1rem; letter-spacing: -.01em; }
			.sc-h1 em { font-style: italic; color: #7ed9b8; }
			.sc-lead { font-size: 1.12rem; font-weight: 300; color: rgba(255,255,255,.78); line-height: 1.6; margin: 0 0 1.8rem; max-width: 40ch; }
			.sc-cta { display: inline-flex; align-items: center; gap: .6rem; background: var(--mint); color: #fff; text-decoration: none; border-radius: 12px; padding: 1rem 1.5rem; font-weight: 600; font-size: 1.02rem; box-shadow: 0 10px 30px rgba(29,158,117,.35); }
			.sc-cta:hover { background: var(--mint-dark); }
			.sc-cta-note { display: block; margin-top: .75rem; color: rgba(255,255,255,.55); font-size: .82rem; }
			.sc-body { padding: 3rem 1rem 5rem; }
			.sc-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; margin: 0 0 2.2rem; }
			@media (min-width: 640px) { .sc-grid { grid-template-columns: 1fr 1fr; } }
			.sc-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.3rem 1.4rem; }
			.sc-card h2 { font-size: 1.05rem; margin: 0 0 .4rem; }
			.sc-card p { margin: 0; color: #444; line-height: 1.6; font-size: .93rem; }
			.sc-num { display: inline-flex; width: 28px; height: 28px; border-radius: 999px; background: var(--mint-light); color: var(--mint-dark); font-weight: 600; font-size: .85rem; align-items: center; justify-content: center; margin-bottom: .6rem; }
			.sc-h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(1.6rem, 3.5vw, 2.2rem); margin: 0 0 1rem; }
			.sc-terms { list-style: none; padding: 0; margin: 0 0 2.2rem; display: grid; gap: .55rem; }
			.sc-terms li { position: relative; padding-left: 1.5rem; color: #333; font-size: .95rem; line-height: 1.55; }
			.sc-terms li::before { content: ""; position: absolute; left: 0; top: .55rem; width: 9px; height: 9px; border-radius: 50%; background: var(--mint); }
			.sc-proof { display: flex; flex-wrap: wrap; gap: .6rem 1.4rem; color: var(--gray); font-size: .85rem; margin: 0 0 2.2rem; }
			.sc-proof span::before { content: "✓ "; color: var(--mint); font-weight: 600; }
			.sc-bottom { background: var(--dark); color: #fff; border-radius: 16px; padding: 1.8rem 1.6rem; text-align: center; }
			.sc-bottom p { color: rgba(255,255,255,.75); margin: 0 0 1.1rem; }
			.sc-fine { color: var(--gray); font-size: .8rem; line-height: 1.6; margin-top: 1.6rem; }
			.sc-back { color: var(--mint); text-decoration: none; font-size: .9rem; }
			`}</style>

			<div className="sc-page">
				<section className="sc-hero">
					<div className="sc-wrap">
						<p className="sc-eye">Manhattan only · New clients · Through October 31, 2026</p>
						<h1 className="sc-h1">
							Second clean<br />
							<em>on us.</em>
						</h1>
						<p className="sc-lead">
							Book your first clean by October 31 and your second standard clean of the same apartment is free,
							any time in the next {SECOND_WINDOW_DAYS} days. Two cleans, one price.
						</p>
						<a className="sc-cta" href={BOOK_HREF}>
							Book my first clean <span aria-hidden="true">→</span>
						</a>
						<span className="sc-cta-note">Code {SECOND_PROMO_CODE} is applied for you. Takes about a minute. Card charged only after the clean.</span>
					</div>
				</section>

				<section className="sc-body">
					<div className="sc-wrap">
						<h2 className="sc-h2">How it works</h2>
						<div className="sc-grid">
							<div className="sc-card">
								<span className="sc-num">1</span>
								<h2>Book your first clean</h2>
								<p>Pick a date, add your building access notes, done. Studio and 1BR from $175, all supplies included.</p>
							</div>
							<div className="sc-card">
								<span className="sc-num">2</span>
								<h2>We clean, you get photos</h2>
								<p>Texts when your cleaner is on the way, when they arrive, and when they finish, with a photo summary the owner reviews.</p>
							</div>
							<div className="sc-card">
								<span className="sc-num">3</span>
								<h2>Your free code arrives</h2>
								<p>The moment your first clean is marked complete, we text you a personal code for the second one.</p>
							</div>
							<div className="sc-card">
								<span className="sc-num">4</span>
								<h2>Book the free one</h2>
								<p>Any date within {SECOND_WINDOW_DAYS} days. Same apartment, standard clean, same cleaner if you want them.</p>
							</div>
						</div>

						<h2 className="sc-h2">The fine print, in plain English</h2>
						<ul className="sc-terms">
							<li>New clients only. If you've booked with us before, this one isn't for you, but your friend code is.</li>
							<li>First clean booked by October 31, 2026, at the regular price. Use code {SECOND_PROMO_CODE}, which the button above applies for you.</li>
							<li>The free clean is a standard clean of the same apartment, booked for a date within {SECOND_WINDOW_DAYS} days of the first.</li>
							<li>Add-ons on either clean (deep clean, inside fridge, oven, windows, organization) are priced normally.</li>
							<li>One free clean per household. Not combinable with other codes.</li>
						</ul>

						<div className="sc-proof">
							<span>Background-checked, insured cleaners</span>
							<span>Every Google review five stars</span>
							<span>100% re-clean guarantee</span>
							<span>Manhattan only, co-op and doorman ready</span>
						</div>

						<div className="sc-bottom">
							<h2 className="sc-h2">Two cleans. One price. Ends October 31.</h2>
							<p>Most people who try two cleans keep going. That's the bet we're making.</p>
							<a className="sc-cta" href={BOOK_HREF}>
								Book my first clean <span aria-hidden="true">→</span>
							</a>
						</div>

						<p className="sc-fine">
							Questions? Text <a href="sms:+19148637902" style={{ color: "var(--mint)" }}>(914) 863-7902</a> or reply to any of our emails.
							Full terms, cancellation policy and the re-clean guarantee are on our <Link href="/terms" style={{ color: "var(--mint)" }}>terms page</Link>.
							{" "}<Link href="/" className="sc-back">← Back to manhattanmintnyc.com</Link>
						</p>
					</div>
				</section>
			</div>
		</>
	);
}
