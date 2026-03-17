"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
		"Recurring - save 15%": -0.15,
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
		if (pricingServiceType === "Recurring - save 15%") {
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
			<style>{`*{margin:0;padding:0;box-sizing:border-box;}
:root{
	--mint:#1D9E75;--mint-light:#E1F5EE;--mint-mid:#5DCAA5;--mint-dark:#085041;
	--dark:#0F0F0F;--charcoal:#1A1A1A;--gray:#888;--soft:#F8F8F6;--border:rgba(0,0,0,0.08);
}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:#fff;color:var(--dark);overflow-x:hidden;}

/* TICKER */
.ticker{background:var(--dark);padding:.5rem 0;overflow:hidden;position:relative;}
.ticker::after{content:'';position:absolute;right:0;top:0;width:80px;height:100%;background:linear-gradient(to left,var(--dark),transparent);z-index:2;}
.ticker::before{content:'';position:absolute;left:0;top:0;width:80px;height:100%;background:linear-gradient(to right,var(--dark),transparent);z-index:2;}
.ticker-inner{display:flex;width:max-content;animation:ticker 35s linear infinite;}
.ticker-inner:hover{animation-play-state:paused;}
@keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.tick{display:inline-flex;align-items:center;gap:.5rem;padding:0 2.5rem;font-size:.67rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5);white-space:nowrap;}
.tick-dot{width:3px;height:3px;background:var(--mint-mid);border-radius:50%;flex-shrink:0;}

/* NAV */
nav{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 4rem;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);position:sticky;top:0;z-index:200;border-bottom:.5px solid var(--border);}
.logo{font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:500;letter-spacing:.06em;color:var(--dark);text-decoration:none;}
.logo em{font-style:normal;color:var(--mint);}
.nav-links{display:flex;gap:2.5rem;}
.nav-links a{font-size:.82rem;color:var(--gray);text-decoration:none;letter-spacing:.01em;transition:color .2s;}
.nav-links a:hover{color:var(--dark);}
.nav-r{display:flex;gap:.75rem;align-items:center;}
.btn-tel{font-size:.78rem;color:var(--gray);background:none;border:.5px solid rgba(0,0,0,.15);padding:.48rem 1rem;border-radius:2px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-book{font-size:.78rem;font-weight:500;color:#fff;background:var(--mint);border:none;padding:.52rem 1.25rem;border-radius:2px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s;}
.btn-book:hover{background:var(--mint-dark);}

/* FLOATING CTA */
.float-cta{position:fixed;bottom:2rem;right:2rem;z-index:300;background:var(--mint);color:#fff;border:none;padding:.85rem 1.75rem;border-radius:50px;font-size:.85rem;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 8px 32px rgba(29,158,117,.35);transition:transform .2s,box-shadow .2s;display:flex;align-items:center;gap:.5rem;}
.float-cta:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(29,158,117,.45);}
.float-cta svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

/* HERO */
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:94vh;}
.hero-l{padding:8rem 4rem;display:flex;flex-direction:column;justify-content:center;border-right:.5px solid var(--border);}
.eyebrow{display:flex;align-items:center;gap:.65rem;margin-bottom:2.5rem;font-size:.67rem;letter-spacing:.16em;text-transform:uppercase;color:var(--mint);}
.eyebrow::before{content:'';width:20px;height:1px;background:var(--mint);}
h1{font-family:'DM Serif Display',serif;font-size:clamp(3.2rem,4.5vw,4.8rem);line-height:1.04;letter-spacing:-.025em;font-weight:400;margin-bottom:2rem;}
h1 em{font-style:italic;color:var(--mint);}
.hero-body{font-size:1rem;color:var(--gray);line-height:1.78;max-width:390px;margin-bottom:3rem;font-weight:300;}
.hero-btns{display:flex;gap:.85rem;margin-bottom:2.25rem;}
.btn-primary{background:var(--mint);color:#fff;border:none;padding:.9rem 2.25rem;border-radius:2px;font-size:.88rem;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s;}
.btn-primary:hover{background:var(--mint-dark);}
.btn-secondary{background:transparent;color:var(--dark);border:.5px solid rgba(0,0,0,.2);padding:.9rem 1.85rem;border-radius:2px;font-size:.88rem;cursor:pointer;font-family:'DM Sans',sans-serif;}
.hero-micro{font-size:.7rem;color:#bbb;letter-spacing:.02em;}
.hero-micro span{color:var(--mint);}

/* HERO RIGHT - BOOKING FORM */
.hero-r{background:var(--soft);display:flex;flex-direction:column;justify-content:center;padding:5rem 3.5rem;}
.form-head{font-family:'DM Serif Display',serif;font-size:1.6rem;font-weight:400;margin-bottom:.4rem;letter-spacing:-.01em;}
.form-sub{font-size:.78rem;color:var(--gray);margin-bottom:2rem;line-height:1.55;font-weight:300;}
.form-grid{display:flex;flex-direction:column;gap:.75rem;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
.form-field{display:flex;flex-direction:column;gap:.3rem;}
.form-label{font-size:.67rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);}
.form-input{padding:.65rem .9rem;border:.5px solid rgba(0,0,0,.15);border-radius:2px;font-size:.82rem;font-family:'DM Sans',sans-serif;background:#fff;color:var(--dark);outline:none;transition:border .2s;}
.form-input:focus{border-color:var(--mint);}
.form-select{padding:.65rem .9rem;border:.5px solid rgba(0,0,0,.15);border-radius:2px;font-size:.82rem;font-family:'DM Sans',sans-serif;background:#fff;color:var(--dark);outline:none;appearance:none;cursor:pointer;}
.form-select:focus{border-color:var(--mint);}
.btn-form{width:100%;padding:.85rem;background:var(--mint);color:#fff;border:none;border-radius:2px;font-size:.85rem;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:background .2s;margin-top:.25rem;}
.btn-form:hover{background:var(--mint-dark);}
.form-trust{display:flex;gap:1.25rem;margin-top:1rem;flex-wrap:wrap;}
.ftrust{font-size:.67rem;color:#aaa;display:flex;align-items:center;gap:.3rem;}
.ftrust::before{content:'✓';color:var(--mint);font-size:.65rem;}
.booking-count{color:var(--mint);font-weight:500;display:inline-block;min-width:1.6em;}

/* SECTION */
.section{padding:7rem 4rem;}
.sect-eye{font-size:.67rem;letter-spacing:.16em;text-transform:uppercase;color:var(--mint);margin-bottom:1rem;}
h2{font-family:'DM Serif Display',serif;font-size:clamp(2.2rem,3.2vw,3.2rem);font-weight:400;line-height:1.1;letter-spacing:-.02em;margin-bottom:1rem;}
h2 em{font-style:italic;color:var(--mint);}
.sect-sub{font-size:.95rem;color:var(--gray);line-height:1.78;max-width:440px;margin-bottom:4rem;font-weight:300;}

/* STATS BAND */
.stats-band{background:var(--dark);padding:3.5rem 4rem;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.stat-item{padding:1rem 2rem;border-right:.5px solid rgba(255,255,255,.07);text-align:center;}
.stat-item:last-child{border-right:none;}
.stat-n{font-family:'DM Serif Display',serif;font-size:2.8rem;color:#fff;line-height:1;margin-bottom:.4rem;}
.stat-d{font-size:.72rem;color:rgba(255,255,255,.35);letter-spacing:.06em;line-height:1.5;}

/* FEATURES */
.features-grid{display:grid;grid-template-columns:repeat(4,1fr);border:.5px solid var(--border);}
.feat{padding:2.75rem 2rem;border-right:.5px solid var(--border);}
.feat:last-child{border-right:none;}
.feat-icon{width:40px;height:40px;background:var(--mint-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1.6rem;}
.feat-icon svg{width:15px;height:15px;stroke:var(--mint);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.feat-title{font-size:.88rem;font-weight:500;margin-bottom:.55rem;}
.feat-body{font-size:.79rem;color:var(--gray);line-height:1.68;font-weight:300;}

/* WHAT'S INCLUDED */
.included-bg{background:var(--soft);}
.included-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;}
.included-list{display:flex;flex-direction:column;gap:0;}
.inc-item{display:flex;align-items:center;gap:.85rem;padding:1rem 0;border-bottom:.5px solid var(--border);}
.inc-item:first-child{border-top:.5px solid var(--border);}
.inc-check{width:20px;height:20px;background:var(--mint-light);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.inc-check svg{width:10px;height:10px;stroke:var(--mint);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}
.inc-text{font-size:.84rem;color:var(--dark);font-weight:300;}
.included-aside{position:sticky;top:6rem;}
.price-card-big{background:var(--dark);padding:3rem;border-radius:3px;}
.pcb-eye{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mint-mid);margin-bottom:1.25rem;}
.pcb-mode-toggle{display:flex;gap:.5rem;margin-bottom:1rem;}
.pcb-mode-btn{flex:1;padding:.45rem .65rem;background:rgba(255,255,255,.05);color:rgba(255,255,255,.65);border:.5px solid rgba(255,255,255,.2);border-radius:2px;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;font-family:'DM Sans',sans-serif;}
.pcb-mode-btn.active{background:rgba(29,158,117,.2);border-color:rgba(29,158,117,.4);color:#fff;}
.pcb-select-wrap{display:flex;flex-direction:column;gap:.55rem;margin-bottom:1rem;}
.pcb-select{width:100%;padding:.6rem .7rem;background:rgba(255,255,255,.08);color:#fff;border:.5px solid rgba(255,255,255,.2);border-radius:2px;font-size:.78rem;font-family:'DM Sans',sans-serif;outline:none;}
.pcb-select option{color:#111;background:#fff;}
.pcb-from{font-size:.75rem;color:rgba(255,255,255,.3);margin-bottom:.05rem;position:relative;top:-.22rem;}
.pcb-price{font-family:'DM Serif Display',serif;font-size:4rem;color:#fff;line-height:1;margin-bottom:.25rem;margin-top:-.1rem;}
.pcb-price sup{font-size:.92rem;font-family:'DM Sans',sans-serif;vertical-align:top;margin-top:.28rem;display:inline-block;margin-right:-.3rem;}
.pcb-note{font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:2rem;}
.pcb-tiers{display:flex;flex-direction:column;gap:.5rem;margin-bottom:2rem;}
.pcb-tier{display:flex;justify-content:space-between;align-items:center;padding:.65rem .85rem;background:rgba(255,255,255,.04);border-radius:2px;}
.pcb-tier{cursor:pointer;transition:all .2s;}
.pcb-tier-name{font-size:.78rem;color:rgba(255,255,255,.5);font-weight:300;}
.pcb-tier-price{font-size:.88rem;color:#fff;font-weight:500;}
.pcb-tier.active{background:rgba(29,158,117,.15);border:.5px solid rgba(29,158,117,.25);}
.pcb-tier.active .pcb-tier-name{color:var(--mint-mid);}
.btn-pcb{width:100%;padding:.85rem;background:var(--mint);color:#fff;border:none;border-radius:2px;font-size:.82rem;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;}

/* STEPS */
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}
.step-card{background:var(--soft);padding:3.5rem 2.75rem;}
.step-n{font-family:'DM Serif Display',serif;font-size:4.5rem;color:rgba(29,158,117,.2);line-height:1;margin-bottom:2rem;}
.step-title{font-size:.95rem;font-weight:500;margin-bottom:.6rem;}
.step-body{font-size:.79rem;color:var(--gray);line-height:1.68;font-weight:300;}

/* NEIGHBORHOODS */
.hoods-bg{background:var(--dark);}
.hoods-bg .sect-eye{color:var(--mint-mid);}
.hoods-bg h2{color:#fff;}
.hoods-bg .sect-sub{color:rgba(255,255,255,.35);}
.hoods-grid{display:flex;flex-wrap:wrap;gap:.5rem;}
.hood{background:rgba(255,255,255,.05);border:.5px solid rgba(255,255,255,.08);padding:.5rem 1.1rem;border-radius:2px;font-size:.78rem;color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s;}
.hood:hover{background:rgba(29,158,117,.15);border-color:rgba(29,158,117,.3);color:var(--mint-mid);}

/* REVIEWS */
.reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;}
.review{border:.5px solid var(--border);padding:2.25rem;border-radius:3px;transition:border-color .2s;}
.review:hover{border-color:var(--mint-mid);}
.stars{display:flex;gap:3px;margin-bottom:1.25rem;}
.star{width:10px;height:10px;background:var(--mint);border-radius:50%;}
.rev-text{font-family:'DM Serif Display',serif;font-size:.9rem;line-height:1.68;margin-bottom:1.5rem;font-style:italic;}
.rev-author{font-size:.7rem;color:var(--gray);letter-spacing:.07em;text-transform:uppercase;}

/* FAQ */
.faq-bg{background:var(--soft);}
.faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);}
.faq-item{background:#fff;padding:2rem 2.25rem;}
.faq-q{font-size:.9rem;font-weight:500;margin-bottom:.65rem;}
.faq-a{font-size:.8rem;color:var(--gray);line-height:1.68;font-weight:300;}

/* CTA BAND */
.cta-band{background:var(--mint);padding:7rem 4rem;display:flex;align-items:center;justify-content:space-between;gap:3rem;}
.cta-band h2{color:#fff;max-width:540px;}
.cta-band h2 em{opacity:.7;}
.btn-cta-w{background:#fff;color:var(--mint-dark);border:none;padding:1rem 2.5rem;border-radius:2px;font-size:.9rem;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;white-space:nowrap;}

/* FOOTER */
footer{background:var(--charcoal);padding:5rem 4rem 2.5rem;}
.footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:4rem;padding-bottom:3rem;border-bottom:.5px solid rgba(255,255,255,.07);margin-bottom:2rem;}
.footer-brand-name{font-size:.95rem;font-weight:500;letter-spacing:.06em;color:#fff;margin-bottom:.5rem;}
.footer-brand-name em{font-style:normal;color:var(--mint);}
.footer-tagline{font-size:.75rem;color:rgba(255,255,255,.25);line-height:1.65;max-width:180px;margin-bottom:1.5rem;}
.footer-phone{font-size:.82rem;color:var(--mint-mid);text-decoration:none;}
.fcol-head{font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.2);margin-bottom:1.1rem;}
.fcol a{display:block;font-size:.78rem;color:rgba(255,255,255,.45);text-decoration:none;margin-bottom:.55rem;transition:color .2s;}
.fcol a:hover{color:#fff;}
.footer-bottom{display:flex;justify-content:space-between;font-size:.68rem;color:rgba(255,255,255,.18);}
.footer-bottom a{color:rgba(29,158,117,.7);text-decoration:none;}

/* MOBILE */
@media(max-width:960px){
	nav{padding:1rem 1.5rem;}
	.nav-links{display:none;}
	.btn-tel{display:none;}
	.hero{grid-template-columns:1fr;min-height:auto;}
	.hero-l{padding:4rem 1.5rem;}
	.hero-r{padding:3rem 1.5rem;}
	.form-row{grid-template-columns:1fr;}
	.stats-band{grid-template-columns:1fr 1fr;padding:2.5rem 1.5rem;}
	.stat-item{border-right:none;border-bottom:.5px solid rgba(255,255,255,.07);padding:1.25rem;}
	.stat-item:nth-child(odd){border-right:.5px solid rgba(255,255,255,.07);}
	.features-grid{grid-template-columns:1fr 1fr;}
	.feat:nth-child(2){border-right:none;}
	.feat:nth-child(3),.feat:nth-child(4){border-top:.5px solid var(--border);}
	.included-grid{grid-template-columns:1fr;}
	.included-aside{position:static;}
	.steps-grid{grid-template-columns:1fr;gap:2px;}
	.reviews-grid{grid-template-columns:1fr;}
	.faq-grid{grid-template-columns:1fr;}
	.cta-band{flex-direction:column;padding:4rem 1.5rem;}
	.section{padding:4rem 1.5rem;}
	.footer-top{grid-template-columns:1fr 1fr;gap:2rem;padding:2rem 0;}
	footer{padding:3rem 1.5rem 2rem;}
	.footer-bottom{flex-direction:column;gap:.5rem;}
	.hoods-grid{gap:.4rem;}
	.float-cta{bottom:1.25rem;right:1.25rem;font-size:.8rem;padding:.75rem 1.4rem;}
}`}</style>

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

			{/* TICKER */}
			<div className="ticker">
				<div className="ticker-inner">
					<span className="tick"><span className="tick-dot" />Background-checked cleaners</span>
					<span className="tick"><span className="tick-dot" />Flat-rate from $175</span>
					<span className="tick"><span className="tick-dot" />100% happiness guarantee</span>
					<span className="tick"><span className="tick-dot" />Bonded &amp; insured every visit</span>
					<span className="tick"><span className="tick-dot" />Manhattan specialists</span>
					<span className="tick"><span className="tick-dot" />Same-week availability</span>
					<span className="tick"><span className="tick-dot" />Eco-friendly products included</span>
					<span className="tick"><span className="tick-dot" />No contracts, ever</span>
					<span className="tick"><span className="tick-dot" />COI-ready for buildings</span>
					<span className="tick"><span className="tick-dot" />Doorman &amp; lockbox handling</span>
					<span className="tick"><span className="tick-dot" />Background-checked cleaners</span>
					<span className="tick"><span className="tick-dot" />Flat-rate from $175</span>
					<span className="tick"><span className="tick-dot" />100% happiness guarantee</span>
					<span className="tick"><span className="tick-dot" />Bonded &amp; insured every visit</span>
					<span className="tick"><span className="tick-dot" />Manhattan specialists</span>
					<span className="tick"><span className="tick-dot" />Same-week availability</span>
					<span className="tick"><span className="tick-dot" />Eco-friendly products included</span>
					<span className="tick"><span className="tick-dot" />No contracts, ever</span>
					<span className="tick"><span className="tick-dot" />COI-ready for buildings</span>
					<span className="tick"><span className="tick-dot" />Doorman &amp; lockbox handling</span>
				</div>
			</div>

			{/* NAV */}
			<nav>
				<a className="logo" href="#">manhattan<em>mint</em></a>
				<div className="nav-links">
					<a href="#services">Services</a>
					<a href="#pricing">Pricing</a>
					<a href="#how-it-works">How it works</a>
					<a href="#areas">Areas</a>
					<a href="#reviews">Reviews</a>
				</div>
				<div className="nav-r">
					<button className="btn-tel">(914) 873-4430</button>
					<button className="btn-book" onClick={() => scrollToSection("booking")}>Book a clean</button>
				</div>
			</nav>

			{/* HERO */}
			<div className="hero">
				<div className="hero-l">
					<div className="eyebrow">NYC apartment cleaning</div>
					<h1>Your apartment,<br /><em>immaculate.</em><br />Your time, yours.</h1>
					<p className="hero-body">Premium cleaning built for Manhattan professionals. Background-checked cleaners, same-week availability, and results that are guaranteed — every single time.</p>
					<div className="hero-btns">
						<button className="btn-primary" onClick={() => scrollToSection("booking")}>Book your first clean</button>
						<button className="btn-secondary" onClick={() => scrollToSection("pricing")}>View pricing</button>
					</div>
					<div className="hero-micro">Studio and 1-bedroom homes from <span>$175</span> &nbsp;·&nbsp; Flat-rate pricing &nbsp;·&nbsp; Same-week availability</div>
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
									<option>Recurring — save 15%</option>
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
				<div className="stat-item"><div className="stat-n">48hr</div><div className="stat-d">Earliest available booking</div></div>
				<div className="stat-item"><div className="stat-n">100%</div><div className="stat-d">Satisfaction guarantee</div></div>
			</div>

			{/* FEATURES */}
			<section className="section" id="services" style={{ background: "#fff" }}>
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
										<option>Recurring - save 15%</option>
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
							<div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.25)", marginBottom: "1.5rem" }}>
								{pricingMode === "flat"
									? "Deep clean +$75 · Move-in/out +$100 · Recurring saves 15%"
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
			<section className="section" id="how-it-works" style={{ background: "#fff" }}>
				<div className="sect-eye">How it works</div>
				<h2>Clean in three<br /><em>simple steps.</em></h2>
				<p className="sect-sub">Every friction point removed — from booking to billing.</p>
				<div className="steps-grid">
					<div className="step-card"><div className="step-n">01</div><div className="step-title">Book online in 60 seconds</div><p className="step-body">Select your size, date, and any add-ons. Instant confirmation — no phone call needed.</p></div>
					<div className="step-card"><div className="step-n">02</div><div className="step-title">We show up. You don&apos;t have to.</div><p className="step-body">Your cleaner arrives at the scheduled time. Key handoff, lockbox, or doorman — whatever works for your building.</p></div>
					<div className="step-card"><div className="step-n">03</div><div className="step-title">Come home to perfection</div><p className="step-body">You receive a photo summary. Rate your clean. Subscribe for recurring visits and lock in your preferred cleaner.</p></div>
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
			<section className="section" id="reviews" style={{ background: "#fff" }}>
				<div className="sect-eye">Reviews</div>
				<h2>What Manhattan<br /><em>is saying.</em></h2>
				<p className="sect-sub">Word of mouth built this business. These are the New Yorkers who trusted us first.</p>
				<div className="reviews-grid">
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;Fast booking, clear pricing, great results. My apartment has never been this clean — and I&apos;ve tried four services.&quot;</div><div className="rev-author">— Jason M., Midtown</div></div>
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;They cleaned behind the radiators. Nobody does that. Genuinely the most thorough clean I&apos;ve ever had in New York.&quot;</div><div className="rev-author">— Alex T., Tribeca</div></div>
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;Reliable, respectful, and worth every penny. I switched from a larger service six months ago and haven&apos;t looked back.&quot;</div><div className="rev-author">— Maya L., UWS</div></div>
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;Same cleaner every time, which I really value. My apartment feels like a hotel every single visit.&quot;</div><div className="rev-author">— David K., Chelsea</div></div>
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;Booked on a Tuesday, they were there Thursday. The doorman even complimented how professionally they handled building entry.&quot;</div><div className="rev-author">— Sarah P., UES</div></div>
					<div className="review"><div className="stars"><div className="star" /><div className="star" /><div className="star" /><div className="star" /><div className="star" /></div><div className="rev-text">&quot;As someone with a 3-bedroom in the West Village, finding a reliable team was hard. Manhattan Mint nailed it on the first visit.&quot;</div><div className="rev-author">— Marcus W., West Village</div></div>
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
					<div className="faq-item"><div className="faq-q">What if I&apos;m not satisfied?</div><div className="faq-a">We&apos;ll come back and re-clean at no charge. 100% satisfaction is not a marketing line — it&apos;s our standard operating policy.</div></div>
					<div className="faq-item"><div className="faq-q">Can I request the same cleaner every time?</div><div className="faq-a">Yes. Once you&apos;ve had a great experience with a specific cleaner, you can request them for all future visits when you subscribe.</div></div>
					<div className="faq-item"><div className="faq-q">Is your team insured?</div><div className="faq-a">Every cleaner is fully bonded and insured. We are also COI-ready for co-op and condo buildings that require it.</div></div>
					<div className="faq-item"><div className="faq-q">How do I cancel or reschedule?</div><div className="faq-a">Text or email us any time. No cancellation fees, no contracts. We only ask for 24 hours notice when possible.</div></div>
				</div>
			</section>

			{/* CTA BAND */}
			<div className="cta-band">
				<h2>Ready for the cleanest<br />apartment in Manhattan?<br /><em>Starts at $175, all in.</em></h2>
				<button className="btn-cta-w" onClick={() => scrollToSection("booking")}>Book your first clean →</button>
			</div>

			{/* FOOTER */}
			<footer>
				<div className="footer-top">
					<div>
						<div className="footer-brand-name">manhattan<em>mint</em></div>
						<div className="footer-tagline">Flawless clean. Honest service. True to New York.</div>
						<a className="footer-phone" href="tel:9148734430">(914) 873-4430</a>
					</div>
					<div className="fcol">
						<div className="fcol-head">Services</div>
						<a href="#">Standard clean</a><a href="#">Deep clean</a>
						<a href="#">Move-in / out</a><a href="#">Recurring plans</a><a href="#">Add-ons</a>
					</div>
					<div className="fcol">
						<div className="fcol-head">Company</div>
						<a href="#">About us</a><a href="#">Areas served</a>
						<a href="#">FAQ</a><a href="#">Careers</a><a href="#">Share &amp; save $20</a>
					</div>
					<div className="fcol">
						<div className="fcol-head">Contact</div>
						<a href="mailto:hello@manhattanmintnyc.com">hello@manhattanmintnyc.com</a>
						<a href="tel:9148734430">(914) 873-4430</a>
						<a href="#">Instagram</a><a href="#">Google Reviews</a>
					</div>
				</div>
				<div className="footer-bottom">
					<div>&copy; 2026 Manhattan Mint NYC. All rights reserved.</div>
					<div>Bonded · Insured · COI-ready · <a href="tel:9148734430">(914) 873-4430</a></div>
				</div>
			</footer>
		</>
	);
}
