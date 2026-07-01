"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmailCaptureModal from "./components/EmailCaptureModal";
import EmailCaptureSection from "./components/EmailCaptureSection";
import { caseStudies } from "./case-studies/data";
import { reviews, GOOGLE_REVIEWS_URL } from "./reviews";
import "./home.css";

export default function Page() {
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
		"Recurring - save 30%": -0.3,
	};
	const [selectedTier, setSelectedTier] = useState(tiers[0]);
	const [pricingMode, setPricingMode] = useState<"flat" | "hourly">("flat");
	const [pricingServiceType, setPricingServiceType] = useState("Standard clean");
	const [hourlyHours, setHourlyHours] = useState(3);
	const [hourlyCleaners, setHourlyCleaners] = useState(2);
	const [weeklyBookings, setWeeklyBookings] = useState(27);
	const [form, setForm] = useState({
		fullName: "",
		phone: "",
		email: "",
		address: "",
		apartmentSize: "Studio / 1BR — $175",
		serviceType: "Standard clean",
		notes: "",
	});

	const effectiveFlatPrice = (() => {
		if (selectedTier.amount === null) return "Custom";
		if (pricingServiceType === "Recurring - save 30%") {
			return `$${Math.round(selectedTier.amount * 0.85)}`;
		}
		const adjustment = serviceAdjustments[pricingServiceType];
		const total = selectedTier.amount + (typeof adjustment === "number" ? adjustment : 0);
		return `$${total}`;
	})();

	const effectiveHourlyPrice = `$${hourlyHours * hourlyCleaners * hourlyRates.ratePerCleaner}`;

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setWeeklyBookings((prev) => {
				const delta = Math.random() > 0.5 ? 1 : -1;
				const next = prev + delta;
				if (next < 23) return 24;
				if (next > 34) return 33;
				return next;
			});
		}, 4000);

		return () => window.clearInterval(intervalId);
	}, []);

	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleRequestBooking = () => {
		const isHourlyBooking = form.serviceType.startsWith("Hourly clean");
		localStorage.setItem("mm_name", form.fullName);
		localStorage.setItem("mm_email", form.email);
		localStorage.setItem("mm_phone", form.phone);
		localStorage.setItem("mm_address", form.address);
		localStorage.setItem("mm_size", isHourlyBooking ? "Hourly booking" : form.apartmentSize);
		localStorage.setItem("mm_service", form.serviceType);
		localStorage.setItem("mm_date", form.notes);

		router.push("/quote");
	};

	const applyPricingSelectionToBookingForm = () => {
		if (pricingMode === "flat") {
			setForm((prev) => ({
				...prev,
				apartmentSize: `${selectedTier.name} — ${selectedTier.price}`,
				serviceType: pricingServiceType,
			}));
			return;
		}

		setForm((prev) => ({
			...prev,
			apartmentSize: "Hourly booking",
			serviceType: `Hourly clean (${hourlyHours}h, ${hourlyCleaners} cleaner${hourlyCleaners === 1 ? "" : "s"})`,
		}));
	};

	return (
		<>
			<EmailCaptureModal />


			{/* FLOATING BOOK BUTTON */}
			<button className="float-cta" onClick={() => scrollToSection("booking")}>
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
					<p className="hero-body">Luxury home cleaning built for Manhattan professionals. Background-checked cleaners, eco-friendly supplies, next-day and same-week availability — and results that are guaranteed, every single time.</p>
					<div className="hero-btns">
						<button className="btn-primary" onClick={() => scrollToSection("booking")}>Book your first clean</button>
						<button className="btn-secondary" onClick={() => scrollToSection("pricing")}>View pricing</button>
					</div>
					<div className="hero-micro">Studio and 1-bedroom homes from <span>$175</span> &nbsp;·&nbsp; <Link href="/pricing-availability">Flat-rate pricing</Link> &nbsp;·&nbsp; Same-week availability</div>
				</div>
				<div className="hero-r" id="booking">
					<div className="form-head">Get a fast quote</div>
					<div className="form-sub">Tell us a few details and we&apos;ll confirm your booking same day.</div>
					<div className="form-grid">
						<div className="form-row">
							<div className="form-field">
								<label className="form-label">Full name</label>
								<input
									className="form-input"
									type="text"
									placeholder="Jane Smith"
									value={form.fullName}
									onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
								/>
							</div>
							<div className="form-field">
								<label className="form-label">Phone</label>
								<input
									className="form-input"
									type="tel"
									placeholder="(212) 555-0100"
									value={form.phone}
									onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
								/>
							</div>
						</div>
						<div className="form-field">
							<label className="form-label">Email</label>
							<input
								className="form-input"
								type="email"
								placeholder="jane@email.com"
								value={form.email}
								onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
							/>
						</div>
						<div className="form-field">
							<label className="form-label">Address (building + unit)</label>
							<input
								className="form-input"
								type="text"
								placeholder="123 W 57th St, Apt 4B"
								value={form.address}
								onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
							/>
						</div>
						<div className="form-row">
							<div className="form-field">
								<label className="form-label">Apartment size</label>
								<select
									className="form-select"
									value={form.apartmentSize}
									onChange={(e) => setForm((prev) => ({ ...prev, apartmentSize: e.target.value }))}
								>
									<option>Hourly booking</option>
									<option>Studio / 1BR — $175</option>
									<option>2 Bedroom — $225</option>
									<option>3 Bedroom — $275</option>
									<option>4+ Bedroom — Custom</option>
								</select>
							</div>
							<div className="form-field">
								<label className="form-label">Service type</label>
								<select
									className="form-select"
									value={form.serviceType}
									onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value }))}
								>
									<option>Standard clean</option>
									<option>Deep clean (+$75)</option>
									<option>Move-in / Move-out (+$100)</option>
									<option>Recurring — save 30%</option>
								</select>
							</div>
						</div>
						<div className="form-field">
							<label className="form-label">Preferred date &amp; notes</label>
							<input
								className="form-input"
								type="text"
								placeholder="ASAP / weekdays preferred / dog at home…"
								value={form.notes}
								onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
							/>
						</div>
						<button className="btn-form" onClick={handleRequestBooking}>Request booking confirmation →</button>
						<div className="form-trust">
							<span className="ftrust">Same-day response</span>
							<span className="ftrust">COI available</span>
							<span className="ftrust"><span className="booking-count">{weeklyBookings}</span> bookings this week</span>
						</div>
					</div>
				</div>
			</div>

			{/* STATS BAND */}
			<div className="stats-band">
				<div className="stat-item"><div className="stat-n">500+</div><div className="stat-d">Manhattan apartments cleaned</div></div>
				<div className="stat-item"><div className="stat-n">4.9★</div><div className="stat-d">Average verified rating</div></div>
				<div className="stat-item"><div className="stat-n">24hr</div><div className="stat-d">Earliest available booking</div></div>
				<div className="stat-item"><div className="stat-n">100%</div><div className="stat-d">Satisfaction guarantee</div></div>
			</div>

			{/* FEATURES */}
			<section className="section section-white" id="services">
				<div className="sect-eye">Why manhattan mint</div>
				<h2>Built for the way<br /><em>New Yorkers live.</em></h2>
				<p className="sect-sub">Your schedule is packed, your space is tight, and your standards are high. Every part of Manhattan Mint was built around that.</p>
				<div className="features-grid">
					<div className="feat">
						<div className="feat-icon"><svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg></div>
						<div className="feat-title">Vetted professionals</div>
						<p className="feat-body">Every cleaner is background-checked, insured, and trained to our standard before their first booking.</p>
					</div>
					<div className="feat">
						<div className="feat-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
						<div className="feat-title">Book in 60 seconds</div>
						<p className="feat-body">Select size, date, and add-ons online. Instant confirmation — no phone calls, no back-and-forth.</p>
					</div>
					<div className="feat">
						<div className="feat-icon"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></div>
						<div className="feat-title">Apartment specialists</div>
						<p className="feat-body">We work exclusively in Manhattan. Our team knows co-op rules, tight layouts, and building access.</p>
					</div>
					<div className="feat">
						<div className="feat-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
						<div className="feat-title">Fully insured</div>
						<p className="feat-body">Full liability on every visit. If anything is ever not right, we fix it — no questions, no hassle.</p>
					</div>
				</div>
			</section>

			{/* WHAT'S INCLUDED + PRICING */}
			<section className="section included-bg" id="pricing">
				<div className="sect-eye">What&apos;s included</div>
				<h2>Everything clean,<br /><em>nothing hidden.</em></h2>
				<p className="sect-sub">One flat rate covers all of this — no à la carte surprises on the invoice.</p>
				<div className="included-grid">
					<div className="included-list">
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">All bedrooms vacuumed &amp; dusted</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Kitchen surfaces wiped &amp; degreased</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Stovetop scrubbed</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Bathroom(s) sanitized top to bottom</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Floors mopped throughout</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">All mirrors &amp; glass surfaces cleaned</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Trash emptied in every room</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Baseboards dusted</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Countertops cleared &amp; wiped</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Light fixtures &amp; switches wiped</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Inside microwave cleaned</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Radiators dusted</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Entryway &amp; hallway cleaned</div></div>
						<div className="inc-item"><div className="inc-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div><div className="inc-text">Photo summary sent after every visit</div></div>
					</div>
					<div className="included-aside">
						<div className="price-card-big">
							<div className="pcb-eye">Pricing</div>
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
										<option>Recurring - save 30%</option>
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
							<div className="pcb-from">Starting from</div>
							<div className="pcb-price">
								{(pricingMode === "flat" ? effectiveFlatPrice : effectiveHourlyPrice).replace("$", "")}
							</div>
							<div className="pcb-note">All supplies included · No hidden fees</div>
							<div className="pcb-detail">
								{pricingMode === "flat"
									? "Deep clean +$75 · Move-in/out +$100 · Recurring saves 30%"
									: `$${hourlyRates.ratePerCleaner}/hr per cleaner · same supplies included`}
							</div>
							<button
								className="btn-pcb"
								onClick={() => {
									applyPricingSelectionToBookingForm();
									scrollToSection("booking");
								}}
							>
								Book at this rate →
							</button>
						</div>
					</div>
				</div>
			</section>

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

			{/* CREDENTIALS / TRUST */}
			<section className="section cred-bg" id="credentials">
				<div className="sect-eye">Who you&apos;re letting in</div>
				<h2>A team you can<br /><em>actually vet.</em></h2>
				<p className="sect-sub">Trust isn&apos;t a tagline — it&apos;s paperwork, screening, and a founder who reviews every job.</p>
				<div className="cred-grid">
					<div className="cred-copy">
						<p>Manhattan Mint is an owner-operated NYC company, not a lead-generation marketplace. Every cleaner on our team is interviewed in person, background-checked before their first booking, and trained on our checklist — the same one behind every clean in our <Link href="/case-studies">case studies</Link>.</p>
						<p>We work exclusively in Manhattan buildings, which means COIs, service-elevator reservations, doorman check-ins, and <Link href="/blog/cleaning-services-for-co-ops">co-op house rules</Link> are part of our normal workflow — not a surprise.</p>
						<div className="founder-card">
							<div className="founder-avatar">mm</div>
							<div>
								<div className="founder-name">Owner-operated, Manhattan-based</div>
								<div className="founder-role">The owner personally reviews every job&apos;s photo summary before it&apos;s closed out</div>
							</div>
						</div>
					</div>
					<div className="cred-list">
						<div className="cred-item">
							<div className="cred-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
							<div>
								<div className="cred-title">Background-checked, every hire</div>
								<div className="cred-body">Third-party screening is completed before a cleaner ever enters a client&apos;s home.</div>
							</div>
						</div>
						<div className="cred-item">
							<div className="cred-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
							<div>
								<div className="cred-title">Bonded &amp; fully insured</div>
								<div className="cred-body">Liability coverage on every visit, with certificates of insurance issued for buildings that require them.</div>
							</div>
						</div>
						<div className="cred-item">
							<div className="cred-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
							<div>
								<div className="cred-title">Photo-verified quality</div>
								<div className="cred-body">A photo summary is sent after every clean, and the founder reviews the results before the job is closed out.</div>
							</div>
						</div>
						<div className="cred-item">
							<div className="cred-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
							<div>
								<div className="cred-title">100% re-clean guarantee</div>
								<div className="cred-body">If anything isn&apos;t right, we come back and fix it at no charge — our standard policy, in writing in our <Link href="/terms">terms</Link>.</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* NEIGHBORHOODS */}
			<section className="section hoods-bg" id="areas">
				<div className="sect-eye">Service areas</div>
				<h2>All of Manhattan.<br /><em>Your neighborhood, covered.</em></h2>
				<p className="sect-sub">We operate across all Manhattan neighborhoods, plus select parts of Brooklyn and Queens on request.</p>
				<div className="hoods-grid">
					<div className="hood">Tribeca</div><div className="hood">SoHo</div><div className="hood">West Village</div>
					<div className="hood">Greenwich Village</div><div className="hood">Chelsea</div><div className="hood">Flatiron</div>
					<div className="hood">Gramercy</div><div className="hood">Murray Hill</div><div className="hood">Midtown</div>
					<div className="hood">Hell&apos;s Kitchen</div><div className="hood">Upper East Side</div><div className="hood">Upper West Side</div>
					<div className="hood">Harlem</div><div className="hood">Washington Heights</div><div className="hood">FiDi</div>
					<div className="hood">Battery Park</div><div className="hood">Nolita</div><div className="hood">Lower East Side</div>
					<div className="hood">Kips Bay</div><div className="hood">Sutton Place</div><div className="hood">Carnegie Hill</div>
					<div className="hood">Morningside Heights</div><div className="hood">Inwood</div><div className="hood">Hudson Yards</div>
					<div className="hood">Yorkville</div>
				</div>
			</section>

			{/* REVIEWS */}
			<section className="section section-white" id="reviews">
				<div className="sect-eye">Reviews</div>
				<h2>What Manhattan<br /><em>is saying.</em></h2>
				<p className="sect-sub">Word of mouth built this business. These are the New Yorkers who trusted us first.</p>
				<div className="reviews-grid">
					{reviews.map((review) => (
						<div className="review" key={`${review.author}-${review.date}`}>
							<div className="rev-head">
								<div className="rev-avatar">{review.author.charAt(0)}</div>
								<div className="rev-who">
									<div className="rev-name">{review.author}</div>
									<div className="rev-place">{review.neighborhood}</div>
								</div>
								{review.source === "Google" && (
									<svg className="rev-g" viewBox="0 0 24 24" aria-label="Posted on Google">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
										<path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
									</svg>
								)}
							</div>
							<div className="rev-stars" aria-label={`${review.rating} out of 5 stars`}>
								{"★★★★★".slice(0, review.rating)}
								<span className="rev-stars-empty">{"★★★★★".slice(review.rating)}</span>
							</div>
							<div className="rev-text">&quot;{review.text}&quot;</div>
							<div className="rev-date">
								{review.date}
								{review.source === "Google" ? " · Posted on Google" : " · Verified client"}
							</div>
						</div>
					))}
				</div>
				{GOOGLE_REVIEWS_URL && (
					<a className="rev-all" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
						Read all of our reviews on Google →
					</a>
				)}
			</section>

			{/* CASE STUDIES */}
			<section className="section" id="case-studies">
				<div className="sect-eye">Case studies</div>
				<h2>Real Manhattan apartments,<br /><em>real results.</em></h2>
				<p className="sect-sub">Pre-war walk-ups, strict co-op boards, tight layouts — see how we handle the challenges unique to cleaning in Manhattan.</p>
				<div className="cs-grid">
					{caseStudies.map((study) => (
						<Link key={study.slug} href={`/case-studies/${study.slug}`} className="cs-card">
							<span className="cs-tag">{study.neighborhood} · {study.propertyType}</span>
							<div className="cs-title">{study.title}</div>
							<p className="cs-excerpt">{study.excerpt}</p>
							<span className="cs-more">Read the case study →</span>
						</Link>
					))}
				</div>
				<Link href="/case-studies" className="cs-all">View all case studies →</Link>
			</section>

			{/* EMAIL CAPTURE */}
			<EmailCaptureSection />

			{/* FAQ */}
			<section className="section faq-bg">
				<div className="sect-eye">FAQ</div>
				<h2>Common questions,<br /><em>straight answers.</em></h2>
				<p className="sect-sub">No runaround. Here&apos;s what most people ask before booking.</p>
				<div className="faq-grid">
					<div className="faq-item"><div className="faq-q">Do I need to be home during the clean?</div><div className="faq-a">No — most clients provide a key, lockbox code, or doorman access. We handle everything professionally and send a photo summary when done.</div></div>
					<div className="faq-item"><div className="faq-q">Do you bring your own supplies?</div><div className="faq-a">Yes, always. All cleaning products and equipment are included in your flat rate. We use eco-friendly, non-toxic products by default.</div></div>
					<div className="faq-item"><div className="faq-q">What if I&apos;m not satisfied?</div><div className="faq-a">We&apos;ll come back and re-clean at no charge. 100% satisfaction is not a marketing line — it&apos;s our standard operating policy.</div></div>
					<div className="faq-item"><div className="faq-q">Can I request the same cleaner every time?</div><div className="faq-a">Yes. Once you&apos;ve had a great experience with a specific cleaner, you can request them for all future visits when you subscribe.</div></div>
					<div className="faq-item"><div className="faq-q">Is your team insured?</div><div className="faq-a">Every cleaner is fully bonded and insured. We are also COI-ready for co-op and condo buildings that require it — see how that works in <Link href="/case-studies/co-op-coi-cleaning-upper-east-side">our Upper East Side co-op case study</Link>.</div></div>
					<div className="faq-item"><div className="faq-q">How do I cancel or reschedule?</div><div className="faq-a">Text or email us any time. No cancellation fees, no contracts. We only ask for 24 hours notice when possible.</div></div>
					<div className="faq-item"><div className="faq-q">Do you offer same-day cleaning in NYC?</div><div className="faq-a">Online booking guarantees next-day at the earliest, but same-day cleans are often possible when a cleaner has an opening — call or text <a href="tel:9148637902">(914) 863-7902</a> and we&apos;ll tell you straight away if we can fit you in today.</div></div>
					<div className="faq-item"><div className="faq-q">Are your products safe for kids and pets?</div><div className="faq-a">Yes — we use eco-friendly, non-toxic cleaning products by default on every visit, at no extra charge. If you prefer a specific product for certain surfaces, leave it out and a note, and we&apos;ll use yours.</div></div>
				</div>
			</section>

			{/* CTA BAND */}
			<div className="cta-band">
				<h2>Ready for the cleanest<br />apartment in Manhattan?<br /><em>Starts at $175, all in.</em></h2>
				<button className="btn-cta-w" onClick={() => scrollToSection("booking")}>Book your first clean →</button>
			</div>

		</>
	);
}
