import Link from "next/link";

// Partner offer for Manhattan real estate agents and rental brokers. The
// wording follows 01-offer-and-positioning.md (Tier 2). Fee amounts are the
// owner's to set; change them here and nowhere else.
const REFERRAL_FEE_PER_JOB = 40;
const REFERRAL_FEE_RECURRING = 75;

const MAIL_SUBJECT = encodeURIComponent("Broker partner: free clean of my own apartment");
const MAIL_BODY = encodeURIComponent(
	"Hi Manhattan Mint,\n\nI'm an agent with [brokerage]. I'd like to take you up on the free clean of my own apartment and hear about the referral program.\n\nMy apartment: [address, bedrooms/bathrooms]\nBest days: [days/times]\nCell: [number]\n\nThanks,\n[name]",
);

export default function BrokersPage() {
	return (
		<>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
			:root { --mint: #1D9E75; --mint-dark: #157a5a; --mint-light: #E8F5F0; --dark: #0F0F0F; --gray: #777; --soft: #F8F8F6; }
			.bk-page { min-height: 100vh; background: var(--soft); color: var(--dark); font-family: 'DM Sans', sans-serif; }
			.bk-wrap { max-width: 760px; margin: 0 auto; padding: 4rem 1rem 6rem; }
			.bk-back { color: var(--mint); text-decoration: none; font-size: .9rem; font-weight: 500; }
			.bk-back:hover { text-decoration: underline; }
			.bk-eye { color: var(--mint); letter-spacing: .12em; text-transform: uppercase; font-size: .72rem; margin: 2rem 0 .6rem; }
			.bk-h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: clamp(2rem, 4.5vw, 3rem); line-height: 1.1; margin: 0 0 1rem; }
			.bk-h1 em { font-style: italic; color: var(--mint-dark); }
			.bk-lead { font-size: 1.1rem; font-weight: 300; color: #333; line-height: 1.6; margin: 0 0 2rem; }
			.bk-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 1.4rem 1.5rem; margin-bottom: 1rem; }
			.bk-card h2 { font-size: 1.15rem; margin: 0 0 .5rem; }
			.bk-card p { margin: 0; color: #444; line-height: 1.6; font-size: .95rem; }
			.bk-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; margin: 1.5rem 0 2rem; }
			@media (min-width: 640px) { .bk-grid { grid-template-columns: 1fr 1fr; } }
			.bk-num { display: inline-flex; width: 28px; height: 28px; border-radius: 999px; background: var(--mint-light); color: var(--mint-dark); font-weight: 600; font-size: .85rem; align-items: center; justify-content: center; margin-bottom: .6rem; }
			.bk-cta { background: var(--dark); color: #fff; border-radius: 14px; padding: 1.6rem 1.5rem; margin-top: 2rem; }
			.bk-cta h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 1.6rem; margin: 0 0 .6rem; }
			.bk-cta p { color: rgba(255,255,255,.8); margin: 0 0 1.1rem; line-height: 1.6; }
			.bk-btns { display: flex; flex-wrap: wrap; gap: .7rem; }
			.bk-btn { display: inline-block; text-decoration: none; border-radius: 10px; padding: .75rem 1.1rem; font-weight: 500; font-size: .95rem; }
			.bk-btn-primary { background: var(--mint); color: #fff; }
			.bk-btn-secondary { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.35); }
			.bk-fine { color: var(--gray); font-size: .82rem; line-height: 1.6; margin-top: 1.5rem; }
			.bk-quote { border-left: 3px solid var(--mint); padding: .2rem 0 .2rem 1rem; color: #333; font-style: italic; margin: 1.5rem 0; }
			`}</style>

			<div className="bk-page">
				<div className="bk-wrap">
					<Link href="/" className="bk-back">← Manhattan Mint</Link>

					<p className="bk-eye">For real estate agents and rental brokers</p>
					<h1 className="bk-h1">
						We&apos;ll clean your own apartment free.<br />
						<em>Then decide if you&apos;d send us a client.</em>
					</h1>
					<p className="bk-lead">
						You recommend a cleaner on your word, and your word is worth a lot. So we&apos;d rather you judge our
						work in your own home than from a flyer. One clean of your apartment, no charge, no strings. If it
						isn&apos;t the best clean you&apos;ve had, we part as friends.
					</p>

					<div className="bk-card">
						<h2>Who this is for</h2>
						<p>
							Agents and brokers who close rentals and sales in Manhattan and get asked, over and over, &ldquo;do you know
							a cleaner?&rdquo; Move-in cleans for new tenants, move-out cleans to return a deposit or hand over keys, and a
							standing recommendation for clients who want someone reliable after they settle in.
						</p>
					</div>

					<p className="bk-eye" style={{ marginTop: "2.2rem" }}>The partner offer</p>
					<div className="bk-grid">
						<div className="bk-card">
							<span className="bk-num">1</span>
							<h2>Free clean of your own apartment</h2>
							<p>One time, on us. Not your client&apos;s place, yours. Book it below and pick the day.</p>
						</div>
						<div className="bk-card">
							<span className="bk-num">2</span>
							<h2>Referral fee on every booked job</h2>
							<p>
								${REFERRAL_FEE_PER_JOB} flat per completed job you send, ${REFERRAL_FEE_RECURRING} if the client
								starts a recurring plan. Paid monthly by Zelle or Venmo, on the first business day, for the prior month.
							</p>
						</div>
						<div className="bk-card">
							<span className="bk-num">3</span>
							<h2>48-hour turnaround on move-in and move-out cleans</h2>
							<p>Give us the address and the access, and the unit is done inside two days. Same-week is the norm.</p>
						</div>
						<div className="bk-card">
							<span className="bk-num">4</span>
							<h2>A direct line to the owner</h2>
							<p>You text the person who runs the company, not an inbox. The owner reviews every job&apos;s photo summary before it closes.</p>
						</div>
						<div className="bk-card">
							<span className="bk-num">5</span>
							<h2>A one-pager you can forward without editing</h2>
							<p>Pricing, what&apos;s included, insurance, and how to book, on one page, ready to send to a client the moment they ask.</p>
						</div>
						<div className="bk-card">
							<span className="bk-num">6</span>
							<h2>Your client gets the same standard you did</h2>
							<p>Background-checked, insured cleaners. Photo summary after every visit. 100% re-clean guarantee, in writing.</p>
						</div>
					</div>

					<blockquote className="bk-quote">
						Manhattan only. Co-op rules, doorman check-ins, service elevator reservations and COIs on request are part of
						the job, not a surprise.
					</blockquote>

					<div className="bk-cta">
						<h2>Start with your own apartment.</h2>
						<p>
							Email us from your brokerage address with your apartment size and a couple of days that work, or just text.
							We&apos;ll confirm within the day.
						</p>
						<div className="bk-btns">
							<a className="bk-btn bk-btn-primary" href={`mailto:hello@manhattanmintnyc.com?subject=${MAIL_SUBJECT}&body=${MAIL_BODY}`}>
								Email hello@manhattanmintnyc.com
							</a>
							<a className="bk-btn bk-btn-secondary" href="sms:+19148637902">Text (914) 863-7902</a>
						</div>
					</div>

					<p className="bk-fine">
						Referral fees are paid on completed, paid jobs where you made the introduction. Your free clean is a standard
						clean of a Manhattan apartment up to three bedrooms; larger homes and deep cleans are quoted at a partner rate.
						See our <Link href="/terms" style={{ color: "var(--mint)" }}>terms</Link> for the re-clean guarantee and
						cancellation policy.
					</p>
				</div>
			</div>
		</>
	);
}
