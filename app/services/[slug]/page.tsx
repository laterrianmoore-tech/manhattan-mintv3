import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { servicePages } from "../data";
import { ROOMS, RANK, TIERS } from "../../components/checklist-data";
import { faqGroups } from "../../faq/data";
import { renderInline } from "../../blog/inline-links";
import "../../case-studies/case-studies.css";
import "../services.css";

type Props = { params: Promise<{ slug: string }> };
const SITE = "https://manhattanmintnyc.com";

export function generateStaticParams() {
	return servicePages.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = servicePages.find((p) => p.slug === slug);
	if (!page) return {};
	return {
		title: page.metaTitle,
		description: page.metaDescription,
		alternates: { canonical: `/services/${page.slug}` },
		openGraph: { title: `${page.metaTitle} | Manhattan Mint`, description: page.metaDescription, type: "website" },
	};
}

const allFaqs = faqGroups.flatMap((g) => g.items);
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export default async function ServicePage({ params }: Props) {
	const { slug } = await params;
	const page = servicePages.find((p) => p.slug === slug);
	if (!page) notFound();

	const tier = TIERS.find((t) => t.key === page.tier)!;
	const rooms = ROOMS.map((r) => ({
		room: r.room,
		items: r.items.filter((i) => RANK[i.tier] <= RANK[page.tier]).map((i) => i.text),
	})).filter((r) => r.items.length);
	const points = rooms.reduce((n, r) => n + r.items.length, 0);
	const faqs = page.faqs.map((q) => allFaqs.find((f) => f.q === q)).filter(Boolean) as { q: string; a: string }[];
	const others = servicePages.filter((p) => p.slug !== page.slug);

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "Service",
			name: page.name,
			serviceType: `${page.name} — Manhattan, NYC`,
			description: page.metaDescription,
			areaServed: { "@type": "City", name: "New York" },
			provider: { "@type": "LocalBusiness", name: "Manhattan Mint", url: SITE, telephone: "+1-914-863-7902" },
			url: `${SITE}/services/${page.slug}/`,
		},
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
				{ "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services/` },
				{ "@type": "ListItem", position: 3, name: page.name, item: `${SITE}/services/${page.slug}/` },
			],
		},
	];

	return (
		<div className="cs-page sv-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

			<div className="sv-hero">
				<div>
					<div className="cs-eye">{page.eyebrow}</div>
					<h1 className="cs-h1">
						{page.h1[0]}
						<br />
						<em>{page.h1[1]}</em>
					</h1>
					<p className="cs-lede">{page.lede}</p>
					<div className="sv-actions">
						<Link href="/#pricing" className="sv-btn">See your exact price →</Link>
						<Link href="/quote" className="sv-btn-ghost">Book now</Link>
					</div>
					<div className="sv-trust">
						<span>Charged only after the clean</span>
						<span>Supplies included</span>
						<span>Free re-clean guarantee</span>
					</div>
				</div>
				<aside className="sv-price">
					<div className="sv-price-eye">{page.tier === "Standard" ? "Flat rate from" : "Add to any flat rate"}</div>
					<div className="sv-price-n">{page.price.from}</div>
					<div className="sv-price-note">{page.price.note}</div>
					<div className="sv-price-pts">
						<strong>{points} details</strong> on the Mint Mark checklist
					</div>
					<Link href="/#pricing" className="sv-price-btn">Price my apartment →</Link>
				</aside>
			</div>

			<section className="sv-section">
				<h2 className="cs-section-head">Best for</h2>
				<ul className="cs-results">
					{page.bestFor.map((b) => (
						<li key={b}>{b}</li>
					))}
				</ul>
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">What&apos;s included: all {points} details</h2>
				<p className="sv-sub">{tier.blurb} Every item below is checked off on every {page.name.toLowerCase()} visit.</p>
				<div className="sv-rooms">
					{rooms.map((r) => (
						<div className="sv-room" key={r.room}>
							<h3>{r.room}</h3>
							<ul>
								{r.items.map((i) => (
									<li key={i}>{i}</li>
								))}
							</ul>
						</div>
					))}
				</div>
				{page.notIncluded && <p className="sv-not">{page.notIncluded}</p>}
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">How it works</h2>
				<div className="sv-steps">
					{page.howItWorks.map((s, i) => (
						<div className="sv-step" key={s.title}>
							<span className="sv-step-n">{i + 1}</span>
							<div>
								<h3>{s.title}</h3>
								<p>{s.body}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="sv-section sv-proof">
				<div>
					<div className="cs-eye">See it done</div>
					<h2 className="sv-proof-h">
						<Link href={`/case-studies/${page.caseStudy.slug}`}>{page.caseStudy.label} →</Link>
					</h2>
					<p>
						Real apartment, real photos, what we found and what we did. Or read the guide behind this service:{" "}
						<Link href={`/blog/${page.guide.slug}`}>{page.guide.label}</Link>.
					</p>
				</div>
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">Questions people ask about {page.name.toLowerCase()}</h2>
				<div className="sv-faqs">
					{faqs.map((f) => (
						<details key={f.q} className="faq-d">
							<summary>
								<span>{f.q}</span>
								<span className="faq-plus" aria-hidden="true" />
							</summary>
							<p>{renderInline(f.a)}</p>
						</details>
					))}
				</div>
				<p className="sv-more">
					<Link href="/faq">See every question we get asked →</Link>
				</p>
			</section>

			<div className="cs-cta">
				<h2 className="cs-cta-h">
					{page.cta.heading[0]} <em>{page.cta.heading[1]}</em>
				</h2>
				<p>{page.cta.body}</p>
				<Link href="/#pricing" className="cs-cta-btn">See your price →</Link>
			</div>

			<div className="cs-related">
				<h2 className="cs-related-head">Other services</h2>
				{others.map((o) => (
					<Link key={o.slug} href={`/services/${o.slug}`}>
						{o.name} →
					</Link>
				))}
				<Link href="/brokers">For brokers &amp; agents →</Link>
			</div>
		</div>
	);
}
