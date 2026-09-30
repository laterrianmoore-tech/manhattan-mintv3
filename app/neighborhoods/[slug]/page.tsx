import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { neighborhoods } from "../data";
import { faqGroups } from "../../faq/data";
import { renderInline } from "../../blog/inline-links";
import "../../case-studies/case-studies.css";
import "../../services/services.css";
import "../neighborhoods.css";

type Props = { params: Promise<{ slug: string }> };
const SITE = "https://manhattanmintnyc.com";

export function generateStaticParams() {
	return neighborhoods.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const n = neighborhoods.find((x) => x.slug === slug);
	if (!n) return {};
	return {
		title: n.metaTitle,
		description: n.metaDescription,
		alternates: { canonical: `/neighborhoods/${n.slug}` },
		openGraph: {
			title: `${n.metaTitle} | Manhattan Mint`,
			description: n.metaDescription,
			type: "website",
			...(n.image ? { images: [{ url: n.image.src, alt: n.image.alt }] } : {}),
		},
	};
}

const allFaqs = faqGroups.flatMap((g) => g.items);
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export default async function NeighborhoodPage({ params }: Props) {
	const { slug } = await params;
	const n = neighborhoods.find((x) => x.slug === slug);
	if (!n) notFound();

	const faqs = n.faqs.map((q) => allFaqs.find((f) => f.q === q)).filter(Boolean) as { q: string; a: string }[];
	const nearby = n.nearby.map((s) => neighborhoods.find((x) => x.slug === s)).filter(Boolean) as typeof neighborhoods;

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "Service",
			name: `Apartment cleaning in ${n.name}`,
			serviceType: "House cleaning",
			description: n.metaDescription,
			areaServed: { "@type": "Place", name: `${n.name}, Manhattan, New York, NY` },
			provider: { "@type": "LocalBusiness", name: "Manhattan Mint", url: SITE, telephone: "+1-914-863-7902" },
			url: `${SITE}/neighborhoods/${n.slug}/`,
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
				{ "@type": "ListItem", position: 2, name: "Neighborhoods", item: `${SITE}/neighborhoods/` },
				{ "@type": "ListItem", position: 3, name: n.name, item: `${SITE}/neighborhoods/${n.slug}/` },
			],
		},
	];

	return (
		<div className="cs-page sv-page nb-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

			<div className="sv-hero">
				<div>
					<div className="cs-eye">Apartment cleaning · {n.name}</div>
					<h1 className="cs-h1">
						{n.h1[0]}
						<br />
						<em>{n.h1[1]}</em>
					</h1>
					<div className="nb-bounds">{n.bounds}</div>
					<p className="cs-lede">{n.lede}</p>
					<div className="sv-actions">
						<Link href="/#pricing" className="sv-btn">See your exact price →</Link>
						<Link href="/quote" className="sv-btn-ghost">Book now</Link>
					</div>
					<div className="sv-trust">
						<span>Charged only after the clean</span>
						<span>Same cleaner every visit</span>
						<span>COI-ready</span>
					</div>
				</div>
				<aside className="nb-side">
					{n.image && (
						<figure className="nb-photo">
							<Image src={n.image.src} alt={n.image.alt} fill sizes="(max-width: 900px) 100vw, 360px" priority />
						</figure>
					)}
					<div className="sv-price nb-popular">
						<div className="sv-price-eye">Most booked here</div>
						<div className="nb-popular-name">{n.popular.service}</div>
						<p className="nb-popular-why">{n.popular.why}</p>
						<div className="nb-popular-ex">{n.popular.example}</div>
						<Link href={`/services/${n.popular.serviceSlug}`} className="sv-price-btn">About this service →</Link>
					</div>
				</aside>
			</div>

			<section className="sv-section">
				<h2 className="cs-section-head">What we clean in {n.name}</h2>
				<div className="nb-buildings">
					{n.buildings.map((b) => (
						<div className="nb-building" key={b.title}>
							<h3>{b.title}</h3>
							<p>{b.body}</p>
						</div>
					))}
				</div>
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">What the dirt is like here</h2>
				<ul className="cs-results">
					{n.realities.map((r) => (
						<li key={r}>{r}</li>
					))}
				</ul>
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">Getting in: doormen, keys and COIs</h2>
				<p className="nb-access">{n.access}</p>
			</section>

			<section className="sv-section sv-proof">
				<div>
					<div className="cs-eye">See it done nearby</div>
					<h2 className="sv-proof-h">
						<Link href={`/case-studies/${n.caseStudy.slug}`}>{n.caseStudy.label} →</Link>
					</h2>
					<p>
						Real apartment, real photos, what we found and what we did. Or read the guide that applies here:{" "}
						<Link href={`/blog/${n.guide.slug}`}>{n.guide.label}</Link>.
					</p>
				</div>
			</section>

			<section className="sv-section">
				<h2 className="cs-section-head">Questions {n.name} clients ask</h2>
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
					Ready for the cleanest apartment <em>in {n.name}?</em>
				</h2>
				<p>See your exact price on the home page and book in 60 seconds. Not right the first time? We come back and fix it, free.</p>
				<Link href="/#pricing" className="cs-cta-btn">See your price →</Link>
			</div>

			<div className="cs-related">
				<h2 className="cs-related-head">Nearby</h2>
				{nearby.map((o) => (
					<Link key={o.slug} href={`/neighborhoods/${o.slug}`}>
						{o.name} →
					</Link>
				))}
				<Link href="/neighborhoods">All neighborhoods →</Link>
			</div>
		</div>
	);
}
