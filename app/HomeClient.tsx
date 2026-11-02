"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CleanChecklist from "./components/CleanChecklist";
import EmailCaptureModal from "./components/EmailCaptureModal";
import { reviews, REVIEW_SOURCES, type Review } from "./reviews";
import type { GoogleRating } from "@/lib/google-rating";
import "./home.css";

// The homepage body. Rendered by app/page.tsx (a server component) which
// fetches the live Google rating; null means "couldn't fetch — hide the number".
//
// Trimmed 2026-11-02 (owner: "make it the best as possible"): the page ran
// about 20 screens with 14 headlines and 11 booking buttons. The hero form,
// credentials, guarantee, case-study and email-capture sections are gone;
// their one-of-a-kind lines moved into "Why" and the FAQ. The hero now leads
// with a photograph and a ten-second price instead of a form.
function GoogleMark({ className = "rev-g" }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" aria-label="Google">
			<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
			<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
			<path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
			<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
		</svg>
	);
}

// One review card, badged with the logo of wherever it was posted.
function ReviewCard({ review }: { review: Review }) {
	return (
		<div className="review">
			<div className="rev-head">
				<div className="rev-avatar">{review.author.charAt(0)}</div>
				<div className="rev-who">
					<div className="rev-name">{review.author}</div>
					<div className="rev-place">{review.neighborhood ?? (review.source === "Direct" ? "Verified client" : `${review.source} review`)}</div>
				</div>
				{review.source === "Google" && <GoogleMark />}
				{review.source === "Yelp" && <img src="/brand/yelp-logo.svg" alt="Posted on Yelp" className="rev-yelp-badge" />}
			</div>
			<div className="rev-stars" aria-label={`${review.rating} out of 5 stars`}>
				{"★★★★★".slice(0, review.rating)}
				<span className="rev-stars-empty">{"★★★★★".slice(review.rating)}</span>
			</div>
			<div className="rev-text">&quot;{review.text}&quot;</div>
			<div className="rev-date">
				{review.date}
				{review.source === "Direct" ? " · Verified client" : ` · Posted on ${review.source}`}
			</div>
		</div>
	);
}

export default function HomeClient({ googleRating }: { googleRating: GoogleRating | null }) {
	const router = useRouter();
	const tiers = [
		{ name: "Studio / 1BR", price: "$175", amount: 175 },
		{ name: "2 Bedroom", price: "$225", amount: 225 },
		{ name: "3 Bedroom", price: "$275", amount: 275 },
		{ name: "4+ Bedroom", price: "Custom", amount: null as number | null },
	];
	const hourlyRates = {
		ratePerCleaner: 65,
	};
	const serviceAdjustments: Record<string, number> = {
		"Standard clean": 0,
		"Deep clean (+$75)": 75,
		"Move-in / Move-out (+$100)": 100,
	};
	// Same tiers the quote page applies (discountRateForFrequency in app/quote/page.tsx).
	const frequencyDiscounts: Record<string, { rate: number; quoteValue: string }> = {
		"One-time": { rate: 0, quoteValue: "One-Time" },
		"Weekly — save 20%": { rate: 0.2, quoteValue: "Weekly" },
		"Bi-weekly — save 15%": { rate: 0.15, quoteValue: "Bi-Weekly" },
		"Monthly — save 10%": { rate: 0.1, quoteValue: "Monthly" },
	};
	const [selectedTier, setSelectedTier] = useState(tiers[0]);
	const [pricingMode, setPricingMode] = useState<"flat" | "hourly">("flat");
	const [pricingServiceType, setPricingServiceType] = useState("Standard clean");
	const [pricingFrequency, setPricingFrequency] = useState("One-time");
	const [hourlyHours, setHourlyHours] = useState(3);
	const [hourlyCleaners, setHourlyCleaners] = useState(2);

	const effectiveFlatPrice = (() => {
		if (selectedTier.amount === null) return "Custom";
		const adjustment = serviceAdjustments[pricingServiceType];
		const base = selectedTier.amount + (typeof adjustment === "number" ? adjustment : 0);
		const discount = frequencyDiscounts[pricingFrequency]?.rate ?? 0;
		return `$${Math.round(base * (1 - discount))}`;
	})();

	const effectiveHourlyPrice = `$${hourlyHours * hourlyCleaners * hourlyRates.ratePerCleaner}`;

	// The floating "Book a clean" pill (phones only, see home.css) appears once
	// the hero's own price card has scrolled away, so there is never more than
	// one booking button on screen at a time.
	const heroRef = useRef<HTMLDivElement>(null);
	const [floatVisible, setFloatVisible] = useState(false);
	useEffect(() => {
		const el = heroRef.current;
		if (!el) return;
		// One rect read per scroll event; React ignores same-value updates.
		const check = () => {
			const r = el.getBoundingClientRect();
			setFloatVisible(r.bottom < 0 || r.top > window.innerHeight);
		};
		check();
		window.addEventListener("scroll", check, { passive: true });
		window.addEventListener("resize", check);
		return () => {
			window.removeEventListener("scroll", check);
			window.removeEventListener("resize", check);
		};
	}, []);

	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	// Carry the size, service and frequency they priced into the quote page,
	// which reads these keys on load.
	const bookAtRate = () => {
		if (pricingMode === "flat") {
			localStorage.setItem("mm_size", `${selectedTier.name} — ${selectedTier.price}`);
			localStorage.setItem("mm_service", pricingServiceType);
			// Only a recurring choice is carried over; a one-time price check
			// leaves the quote page on its own default (Bi-Weekly, the plan we recommend).
			const quoteFrequency = frequencyDiscounts[pricingFrequency]?.quoteValue ?? "One-Time";
			if (quoteFrequency === "One-Time") localStorage.removeItem("mm_frequency");
			else localStorage.setItem("mm_frequency", quoteFrequency);
		} else {
			localStorage.setItem("mm_size", "Hourly booking");
			localStorage.setItem("mm_service", `Hourly clean (${hourlyHours}h, ${hourlyCleaners} cleaner${hourlyCleaners === 1 ? "" : "s"})`);
			localStorage.removeItem("mm_frequency");
		}
		router.push("/quote");
	};

	return (
		<>
			<EmailCaptureModal />

			{/* FLOATING BOOK BUTTON (phones, after the hero) */}
			<button className={`float-cta${floatVisible ? " is-visible" : ""}`} onClick={bookAtRate} aria-hidden={!floatVisible} tabIndex={floatVisible ? 0 : -1}>
				<svg viewBox="0 0 24 24">
					<rect x="3" y="4" width="18" height="18" rx="2" />
					<line x1="3" y1="10" x2="21" y2="10" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="16" y1="2" x2="16" y2="6" />
				</svg>
				Book a clean
			</button>

			{/* HERO */}
			<div className="hero">
				<div className="hero-l">
					<div className="eyebrow">Manhattan apartment cleaning</div>
					<h1>Your apartment,<br /><em>immaculate.</em><br />Your time, yours.</h1>
					<p className="hero-body">Luxury home cleaning built for Manhattan professionals. Book in 60 seconds, and your card is only charged once the clean is done.</p>
					<ul className="hero-proof">
						<li>Background-checked &amp; insured</li>
						<li>Eco-friendly supplies included</li>
						<li>Flat rate, no hidden fees</li>
						<li>Free re-clean guarantee</li>
					</ul>
					<div className="hero-btns">
						<button className="btn-primary" onClick={bookAtRate}>Book your first clean</button>
						<button className="btn-secondary" onClick={() => scrollToSection("pricing")}>See pricing</button>
					</div>
					<div className="hero-micro">Studio and 1-bedroom homes from <span>$175</span> &nbsp;·&nbsp; <Link href="/quote">Flat-rate pricing</Link> &nbsp;·&nbsp; Next-day slots, same-day by text</div>
				</div>
				<div className="hero-r" id="booking" ref={heroRef}>
					{/* Photograph only. Owner 2026-11-02: no price in the hero; it is a premium
					    service and the number up front turns people away before they read. */}
					<Image src="/home/why.jpg" alt="Sunlit, freshly cleaned Manhattan living room with tall windows and a chandelier" fill priority sizes="(max-width: 960px) 100vw, 50vw" className="hero-photo" />
					<div className="hero-caption">
						<span className="hero-caption-eye">The Mint Mark</span>
						<span className="hero-caption-text">Up to 59 details. Every room. Every visit.</span>
					</div>
				</div>
			</div>

			{/* STATS BAND */}
			<div className="stats-band">
				<div className="stat-item"><div className="stat-n">Owner-run</div><div className="stat-d">Every job&apos;s photos reviewed by the owner</div></div>
				{googleRating ? (
					<div className="stat-item">
						<div className="stat-n">{googleRating.rating.toFixed(1)}★</div>
						<div className="stat-d">Google rating from {googleRating.count} {googleRating.count === 1 ? "review" : "reviews"}</div>
					</div>
				) : (
					// Live rating unavailable — never show a stale or made-up number.
					<div className="stat-item"><div className="stat-n">5.0★</div><div className="stat-d">Every Google review, five stars</div></div>
				)}
				<div className="stat-item"><div className="stat-n">24hr</div><div className="stat-d">Earliest available booking</div></div>
				<div className="stat-item"><div className="stat-n">100%</div><div className="stat-d">Satisfaction guarantee</div></div>
			</div>

			{/* WHY (absorbs the old credentials section: founder card + guarantee line) */}
			<section className="section section-white why" id="services">
				<div className="why-grid">
					<div className="why-intro">
						<div className="sect-eye">Why Manhattan Mint</div>
						<h2>Built for the way<br /><em>New Yorkers live.</em></h2>
						<p className="sect-sub why-sub">Your schedule is packed, your space is tight, and your standards are high. Every part of Manhattan Mint was built around that.</p>
						<div className="founder-card">
							<div className="founder-avatar">mm</div>
							<div>
								<div className="founder-name">Owner-operated, Manhattan-based</div>
								<div className="founder-role">Not a marketplace. The owner personally reviews every job&apos;s photo summary before it&apos;s closed out.</div>
							</div>
						</div>
					</div>
					<ol className="why-list">
						<li>
							<span className="why-n">01</span>
							<div>
								<h3>Vetted, then trained.</h3>
								<p>Every cleaner is background-checked through Certn, interviewed in person by the founder, and trained on the Mint Mark checklist before their first booking. On a recurring plan, the same person comes back every time.</p>
							</div>
						</li>
						<li>
							<span className="why-n">02</span>
							<div>
								<h3>Priced in 60 seconds, charged after.</h3>
								<p>See your exact flat rate before you enter a single detail. Book online with instant confirmation, and your card is only charged once the clean is done and the photos are in.</p>
							</div>
						</li>
						<li>
							<span className="why-n">03</span>
							<div>
								<h3>Manhattan, and only Manhattan.</h3>
								<p>Co-op boards, COIs, service-elevator hours, fifth-floor walk-ups, doormen who want a name. We work nowhere else, so we already know your building&apos;s rules. Certificates of insurance issued for buildings that require them.</p>
							</div>
						</li>
						<li>
							<span className="why-n">04</span>
							<div>
								<h3>Bonded, insured, guaranteed.</h3>
								<p>Full liability coverage on every visit. Spot something we missed? Tell us within 48 hours and we send a cleaner back at no charge. No forms, no arguing, and it&apos;s in writing in our <Link href="/terms">terms</Link>.</p>
							</div>
						</li>
					</ol>
				</div>
			</section>

			{/* WHAT'S INCLUDED + PRICING */}
			<section className="section included-bg" id="pricing">
				<div className="sect-eye">Pricing</div>
				<h2>One flat rate.<br /><em>Everything included.</em></h2>
				<p className="sect-sub">Pick your size, pick your frequency, see the exact price. No estimates, no surprises on the invoice.</p>
				<div className="pricing-panel">
				<div className="included-grid pricing-grid">
					<div className="pricing-points">
						<div className="pp-row">
							<span className="pp-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" /></svg></span>
							<div><strong>On the way, arrived, done.</strong><span>Three automatic texts every visit, the moment your cleaner taps each step.</span></div>
						</div>
						<div className="pp-row">
							<span className="pp-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4z" /><circle cx="12" cy="13.5" r="3" /></svg></span>
							<div><strong>Photos before the job closes.</strong><span>The owner reviews every photo summary. Not right? We come back at no charge.</span></div>
						</div>
						<div className="pp-row">
							<span className="pp-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" /></svg></span>
							<div><strong>Same cleaner every visit.</strong><span>Go recurring and the person who learned your apartment is the one who comes back.</span></div>
						</div>
						<div className="pp-row">
							<span className="pp-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="3" y1="10.5" x2="21" y2="10.5" /></svg></span>
							<div><strong>Charged after, never before.</strong><span>Your card is saved at booking and only charged once the clean is done.</span></div>
						</div>
						<div className="tier-block">
							<div className="tier-head">Go recurring and save on every visit</div>
							<div className="tier-grid">
								<div className="tier"><div className="tier-pct">20%</div><div className="tier-name">Weekly</div></div>
								<div className="tier tier-popular"><div className="tier-pct">15%</div><div className="tier-name">Bi-weekly</div><div className="tier-tag">Most popular</div></div>
								<div className="tier"><div className="tier-pct">10%</div><div className="tier-name">Monthly</div></div>
							</div>
							<p className="tier-bonus"><strong>Start weekly or bi-weekly</strong> and the deep clean on your first visit (+$75) is on us.</p>
							<p className="tier-bonus">Need a hand a few times a week instead? Beds, laundry, dishes and tidying, same cleaner, from $80 a visit for a 1-bedroom. <Link href="/housekeeping" style={{ color: "var(--mint-dark)", fontWeight: 500 }}>Housekeeping, quoted per home →</Link></p>
						</div>
					</div>
					<div className="included-aside">
						<div className="price-card-big">
							<div className="pcb-eye">Your exact price — no details needed</div>
							<div className="pcb-mode-toggle">
								<button
									type="button"
									className={`pcb-mode-btn${pricingMode === "flat" ? " active" : ""}`}
									onClick={() => setPricingMode("flat")}
								>
									Flat rate
								</button>
								<button
									type="button"
									className={`pcb-mode-btn${pricingMode === "hourly" ? " active" : ""}`}
									onClick={() => setPricingMode("hourly")}
								>
									Hourly
								</button>
							</div>
							{pricingMode === "flat" ? (
								<div className="pcb-select-wrap">
									<select
										className="pcb-select"
										value={selectedTier.name}
										onChange={(e) => {
											const tier = tiers.find((t) => t.name === e.target.value);
											if (tier) setSelectedTier(tier);
										}}
									>
										{tiers.map((tier) => (
											<option key={tier.name} value={tier.name}>{tier.name} — {tier.price}</option>
										))}
									</select>
									<select
										className="pcb-select"
										value={pricingServiceType}
										onChange={(e) => setPricingServiceType(e.target.value)}
									>
										<option>Standard clean</option>
										<option>Deep clean (+$75)</option>
										<option>Move-in / Move-out (+$100)</option>
									</select>
									<select
										className="pcb-select"
										value={pricingFrequency}
										onChange={(e) => setPricingFrequency(e.target.value)}
										aria-label="How often"
									>
										{Object.keys(frequencyDiscounts).map((f) => (
											<option key={f}>{f}</option>
										))}
									</select>
								</div>
							) : (
								<div className="pcb-select-wrap">
									<select className="pcb-select" value={hourlyHours} onChange={(e) => setHourlyHours(Number(e.target.value))}>
										<option value={2}>2 hours</option>
										<option value={3}>3 hours</option>
										<option value={4}>4 hours</option>
										<option value={5}>5 hours</option>
										<option value={6}>6 hours</option>
									</select>
									<select className="pcb-select" value={hourlyCleaners} onChange={(e) => setHourlyCleaners(Number(e.target.value))}>
										<option value={1}>1 cleaner</option>
										<option value={2}>2 cleaners</option>
									</select>
								</div>
							)}
							<div className="pcb-from">{pricingMode === "flat" && effectiveFlatPrice !== "Custom" ? (pricingFrequency === "One-time" ? "Your flat rate" : "Your flat rate, per visit") : "Starting from"}</div>
							<div className="pcb-price">
								{(pricingMode === "flat" ? effectiveFlatPrice : effectiveHourlyPrice).replace("$", "")}
							</div>
							<div className="pcb-note">All supplies included · No hidden fees · No card needed to see a price</div>
							<div className="pcb-detail">
								{pricingMode === "flat"
									? "Deep clean +$75 · Move-in/out +$100 · Recurring saves up to 20%"
									: `$${hourlyRates.ratePerCleaner}/hr per cleaner · same supplies included`}
							</div>
							<button className="btn-pcb" onClick={bookAtRate}>
								Book at this rate →
							</button>
						</div>
					</div>
				</div>
				</div>
			</section>

			{/* WHAT EACH CLEAN INCLUDES — room-by-room checklist per service level */}
			<CleanChecklist />

			{/* HOW IT WORKS */}
			<section className="section section-white" id="how-it-works">
				<div className="sect-eye">How it works</div>
				<h2>Clean in three<br /><em>simple steps.</em></h2>
				<p className="sect-sub">Every friction point removed — from booking to billing.</p>
				<div className="steps-grid">
					<div className="step-card"><div className="step-n">01</div><div className="step-title">Book online in 60 seconds</div><p className="step-body">Select your size, date, and any add-ons. Instant confirmation — no phone call needed.</p></div>
					<div className="step-card"><div className="step-n">02</div><div className="step-title">We show up. You don&apos;t have to.</div><p className="step-body">Your cleaner arrives at the scheduled time. Key handoff, lockbox, or doorman — whatever works for your building.</p></div>
					<div className="step-card"><div className="step-n">03</div><div className="step-title">Come home to perfection</div><p className="step-body">You receive a photo summary. Rate your clean. Subscribe for recurring visits and lock in your preferred cleaner.</p></div>
				</div>
			</section>

			{/* REVIEWS */}
			<section className="section section-white reviews-section" id="reviews">
				<div className="sect-eye">Reviews</div>
				<h2>What Manhattan<br /><em>is saying.</em></h2>
				<p className="sect-sub">
					{googleRating ? `Rated ${googleRating.rating.toFixed(1)} on Google across ${googleRating.count} reviews. ` : ""}
					Word of mouth built this business — these are the New Yorkers who trusted us first.
				</p>
				{/* Google block: brand header + the scrolling grid of Google reviews */}
				<div className="rev-source">
					<div className="rev-source-head">
						<span className="rev-brand">
							<GoogleMark />
							Google
						</span>
						<span className="rev-source-score">
							<span className="rev-stars" aria-hidden="true">★★★★★</span>
							<strong>{(googleRating?.rating ?? REVIEW_SOURCES.Google.rating).toFixed(1)}</strong>
							· {googleRating?.count ?? REVIEW_SOURCES.Google.count} reviews
						</span>
						<a className="rev-all" href={REVIEW_SOURCES.Google.url} target="_blank" rel="noopener noreferrer">
							Read all on Google →
						</a>
					</div>
					<div className="reviews-scroll">
						<div className="reviews-grid">
							{reviews.filter((r) => r.source === "Google").map((review) => (
								<ReviewCard key={`${review.author}-${review.date}`} review={review} />
							))}
						</div>
						<div className="reviews-fade" aria-hidden="true" />
					</div>
				</div>

				{/* Yelp block: its own panel so nobody has to scroll to find it */}
				<div className="rev-source rev-source-yelp">
					<div className="rev-source-head">
						<span className="rev-brand">
							<img src="/brand/yelp-logo.svg" alt="Yelp" className="rev-yelp-logo" />
						</span>
						<span className="rev-source-score">
							<span className="rev-stars" aria-hidden="true">★★★★★</span>
							<strong>{REVIEW_SOURCES.Yelp.rating.toFixed(1)}</strong>
						</span>
						<a className="rev-all" href={REVIEW_SOURCES.Yelp.url} target="_blank" rel="noopener noreferrer">
							Read all on Yelp →
						</a>
					</div>
					<div className="reviews-grid reviews-grid-yelp">
						{reviews.filter((r) => r.source === "Yelp").map((review) => (
							<ReviewCard key={`${review.author}-${review.date}`} review={review} />
						))}
					</div>
				</div>
				<p className="rev-more">Prefer the long version? <Link href="/case-studies">Read how we handle pre-war walk-ups, strict co-op boards and tight layouts →</Link></p>
			</section>

			{/* NEIGHBORHOODS (compact band) */}
			<section className="section hoods-bg sky-bg hoods-compact" id="areas">
				<div className="hoods-head">
					<div>
						<div className="sect-eye">Service areas</div>
						<h2 className="hoods-title">All of Manhattan.<br /><em>Your neighborhood, covered.</em></h2>
					</div>
					<p className="hoods-lead">Every Manhattan neighborhood, plus select parts of Brooklyn and Queens on request. Tap yours to see what we clean there, or <Link href="/neighborhoods">see every area →</Link></p>
				</div>
				<div className="hoods-grid">
					<Link href="/neighborhoods/tribeca" className="hood">Tribeca</Link><Link href="/neighborhoods/soho" className="hood">SoHo</Link><Link href="/neighborhoods/east-village" className="hood">East Village</Link><Link href="/neighborhoods/west-village" className="hood">West Village</Link>
					<Link href="/neighborhoods" className="hood">Greenwich Village</Link><Link href="/neighborhoods/chelsea" className="hood">Chelsea</Link><Link href="/neighborhoods/flatiron" className="hood">Flatiron</Link>
					<Link href="/neighborhoods" className="hood">Gramercy</Link><Link href="/neighborhoods/murray-hill" className="hood">Murray Hill</Link><Link href="/neighborhoods" className="hood">Midtown</Link>
					<Link href="/neighborhoods" className="hood">Hell&apos;s Kitchen</Link><Link href="/neighborhoods/upper-east-side" className="hood">Upper East Side</Link><Link href="/neighborhoods/upper-west-side" className="hood">Upper West Side</Link>
					<Link href="/neighborhoods/financial-district" className="hood">FiDi</Link>
					<Link href="/neighborhoods" className="hood">Battery Park</Link><Link href="/neighborhoods" className="hood">Nolita</Link><Link href="/neighborhoods" className="hood">Lower East Side</Link>
					<Link href="/neighborhoods" className="hood">Kips Bay</Link><Link href="/neighborhoods" className="hood">Sutton Place</Link>
					<Link href="/neighborhoods" className="hood">Hudson Yards</Link>
					<Link href="/neighborhoods" className="hood">Yorkville</Link>
				</div>
			</section>

			{/* FAQ */}
			<section className="section faq-bg">
				<div className="sect-eye">FAQ</div>
				<h2>Common questions,<br /><em>straight answers.</em></h2>
				<p className="sect-sub">No runaround. Here&apos;s what most people ask before booking.</p>
				<div className="faq-grid">
					<div className="faq-item"><div className="faq-q">Do I need to be home during the clean?</div><div className="faq-a">No — most clients provide a key, lockbox code, or doorman access. We handle everything professionally and send a photo summary when done.</div></div>
					<div className="faq-item"><div className="faq-q">Do you bring your own supplies?</div><div className="faq-a">Yes, always. All cleaning products and equipment are included in your flat rate. We use eco-friendly, non-toxic products by default.</div></div>
					<div className="faq-item"><div className="faq-q">What if I&apos;m not satisfied?</div><div className="faq-a">Tell us within 48 hours and we come back and re-clean at no charge. Every clean is checked against the Mint Mark checklist and the founder reviews the photos before the job is closed out.</div></div>
					<div className="faq-item"><div className="faq-q">Can I request the same cleaner every time?</div><div className="faq-a">Yes. Once you&apos;ve had a great experience with a specific cleaner, you can request them for all future visits when you subscribe.</div></div>
					<div className="faq-item"><div className="faq-q">Is your team insured?</div><div className="faq-a">Every cleaner is fully bonded and insured. We are also COI-ready for co-op and condo buildings that require it — see how that works in <Link href="/case-studies/co-op-coi-cleaning-upper-east-side">our Upper East Side co-op case study</Link>.</div></div>
					<div className="faq-item"><div className="faq-q">How do I cancel or reschedule?</div><div className="faq-a">Text or email us any time. No cancellation fees, no contracts. We only ask for 24 hours notice when possible.</div></div>
					<div className="faq-item"><div className="faq-q">Do you offer same-day cleaning in NYC?</div><div className="faq-a">Online booking guarantees next-day at the earliest, but same-day cleans are often possible when a cleaner has an opening — call or text <a href="tel:9148637902">(914) 863-7902</a> and we&apos;ll tell you straight away if we can fit you in today.</div></div>
					<div className="faq-item"><div className="faq-q">Are your products safe for kids and pets?</div><div className="faq-a">Yes — we use eco-friendly, non-toxic cleaning products by default on every visit, at no extra charge. If you prefer a specific product for certain surfaces, leave it out and a note, and we&apos;ll use yours.</div></div>
				</div>
				<p className="faq-all"><Link href="/faq">See every question we get asked →</Link></p>
			</section>

			{/* NOT FOR EVERYONE */}
			<section className="section notfor-bg sky-bg" id="not-for-everyone">
				<div className="notfor-inner">
					<div className="sect-eye">A straight answer</div>
					<h2>We&apos;re not for everyone.<br /><em>And that&apos;s on purpose.</em></h2>
					<p className="notfor-lede">We are not the cheapest cleaners in Manhattan, and we don&apos;t try to be. Here&apos;s how to tell in ten seconds whether we&apos;re the right call.</p>
					<div className="notfor-grid">
						<div className="notfor-col notfor-no">
							<div className="notfor-head">Probably not us if you want…</div>
							<ul>
								<li>The lowest price on an app, whoever shows up</li>
								<li>A cash job with no insurance behind it</li>
								<li>A different stranger in your home each time</li>
								<li>To bring your own supplies and hope for the best</li>
							</ul>
						</div>
						<div className="notfor-col notfor-yes">
							<div className="notfor-head">Exactly us if you want…</div>
							<ul>
								<li>The same background-checked cleaner every visit</li>
								<li>A bonded, insured company your doorman already knows</li>
								<li>One flat rate, eco-friendly supplies included</li>
								<li>Photos after every clean, and a free re-clean if it&apos;s not right</li>
							</ul>
						</div>
					</div>
					<button className="btn-primary" onClick={bookAtRate}>Sounds like me — book a clean →</button>
				</div>
			</section>

			{/* CTA BAND */}
			<div className="cta-band">
				<h2>Ready for the cleanest<br />apartment in Manhattan?<br /><em>Starts at $175, all in.</em></h2>
				<button className="btn-cta-w" onClick={bookAtRate}>Book your first clean →</button>
			</div>

		</>
	);
}
