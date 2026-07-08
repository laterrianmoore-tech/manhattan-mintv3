import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies } from "../data";
import { renderInline } from "../../blog/inline-links";
import "../case-studies.css";

type Props = { params: Promise<{ slug: string }> };

const SITE = "https://manhattanmintnyc.com";

export function generateStaticParams() {
	return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const study = caseStudies.find((s) => s.slug === slug);
	if (!study) return {};
	return {
		title: study.metaTitle,
		description: study.metaDescription,
		alternates: { canonical: `/case-studies/${study.slug}` },
		openGraph: {
			title: `${study.metaTitle} | Manhattan Mint`,
			description: study.metaDescription,
			type: "article",
			publishedTime: study.publishedAt,
		},
	};
}

export default async function CaseStudyPage({ params }: Props) {
	const { slug } = await params;
	const study = caseStudies.find((s) => s.slug === slug);
	if (!study) notFound();

	const related = caseStudies.filter((s) => s.slug !== study.slug);
	const publishedDate = new Date(`${study.publishedAt}T12:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "Article",
			headline: study.title,
			description: study.metaDescription,
			datePublished: study.publishedAt,
			dateModified: study.publishedAt,
			author: {
				"@type": "Organization",
				name: "Manhattan Mint",
				url: SITE,
				description:
					"Owner-operated residential cleaning company working exclusively in Manhattan. Bonded, insured, and COI-ready for co-op and condo buildings.",
			},
			publisher: {
				"@type": "Organization",
				name: "Manhattan Mint",
				url: SITE,
			},
			mainEntityOfPage: `${SITE}/case-studies/${study.slug}/`,
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
				{ "@type": "ListItem", position: 2, name: "Case studies", item: `${SITE}/case-studies/` },
				{
					"@type": "ListItem",
					position: 3,
					name: study.title,
					item: `${SITE}/case-studies/${study.slug}/`,
				},
			],
		},
	];

	return (
		<div className="cs-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<article className="cs-article">
				<Link href="/case-studies" className="cs-back">
					← All case studies
				</Link>
				<div className="cs-eye">
					{study.neighborhood} · {study.propertyType} · {study.service}
				</div>
				<h1 className="cs-h1">{study.title}</h1>
				<div className="cs-byline">
					<span>
						By <strong>the Manhattan Mint team</strong>
					</span>
					<span>
						Reviewed by <strong>the founder</strong>
					</span>
					<span>{publishedDate}</span>
					<span>
						Service: <Link href="/#services">{study.service}</Link>
					</span>
				</div>

				<h2 className="cs-section-head">The challenge</h2>
				{study.challenge.map((paragraph, index) => (
					<p key={index}>{renderInline(paragraph)}</p>
				))}

				<h2 className="cs-section-head">How we approached it</h2>
				{study.approach.map((step) => (
					<div className="cs-step" key={step.title}>
						<h3 className="cs-step-title">{step.title}</h3>
						<div className="cs-step-body">{renderInline(step.body)}</div>
					</div>
				))}

				<h2 className="cs-section-head">The results</h2>
				<ul className="cs-results">
					{study.results.map((result, index) => (
						<li key={index}>{renderInline(result)}</li>
					))}
				</ul>

				<blockquote className="cs-quote">
					<p>&quot;{study.quote}&quot;</p>
					<cite>— {study.quoteAuthor}</cite>
				</blockquote>

				<aside className="cs-author">
					<h2 className="cs-author-head">About Manhattan Mint</h2>
					<p>
						Manhattan Mint is an owner-operated residential cleaning company working exclusively in
						Manhattan — pre-war walk-ups, doorman co-ops, and converted lofts across the borough.
						Every cleaner is interviewed in person and background-checked, every job&apos;s photo
						summary is reviewed by the founder, and the company is fully bonded, insured, COI-ready
						for co-op and condo buildings, and rated 5.0 on Google.
					</p>
					<p className="cs-author-links">
						<Link href="/blog">Read our cleaning guides</Link> ·{" "}
						<Link href="/#services">Services</Link> · <Link href="/quote">Get a quote</Link>
					</p>
				</aside>

				<div className="cs-cta">
					<h2 className="cs-cta-h">
						Same challenge in <em>your building?</em>
					</h2>
					<p>
						Flat-rate pricing from $175, COIs handled, same-week availability. Check{" "}
						<Link href="/#pricing">flat-rate pricing</Link> or request your
						quote now.
					</p>
					<Link href="/quote" className="cs-cta-btn">
						Get your quote →
					</Link>
				</div>

				<div className="cs-related">
					<h2 className="cs-related-head">Keep reading</h2>
					<Link href={`/blog/${study.relatedGuide.slug}`}>{study.relatedGuide.label} →</Link>
					{related.map((s) => (
						<Link key={s.slug} href={`/case-studies/${s.slug}`}>
							{s.title} →
						</Link>
					))}
					<Link href="/blog">All Manhattan cleaning guides →</Link>
				</div>
			</article>
		</div>
	);
}
