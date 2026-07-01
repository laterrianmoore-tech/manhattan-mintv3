import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies } from "../data";
import "../case-studies.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const study = caseStudies.find((s) => s.slug === slug);
	if (!study) return {};
	return {
		title: study.title,
		description: study.metaDescription,
		alternates: { canonical: `/case-studies/${study.slug}` },
		openGraph: {
			title: `${study.title} | Manhattan Mint`,
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

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: study.title,
		description: study.metaDescription,
		datePublished: study.publishedAt,
		author: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: "https://www.manhattanmintnyc.com",
		},
		publisher: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: "https://www.manhattanmintnyc.com",
		},
		mainEntityOfPage: `https://www.manhattanmintnyc.com/case-studies/${study.slug}/`,
	};

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
				</div>

				<h2 className="cs-section-head">The challenge</h2>
				{study.challenge.map((paragraph, index) => (
					<p key={index}>{paragraph}</p>
				))}

				<h2 className="cs-section-head">How we approached it</h2>
				{study.approach.map((step) => (
					<div className="cs-step" key={step.title}>
						<div className="cs-step-title">{step.title}</div>
						<div className="cs-step-body">{step.body}</div>
					</div>
				))}

				<h2 className="cs-section-head">The results</h2>
				<ul className="cs-results">
					{study.results.map((result, index) => (
						<li key={index}>{result}</li>
					))}
				</ul>

				<blockquote className="cs-quote">
					<p>&quot;{study.quote}&quot;</p>
					<cite>— {study.quoteAuthor}</cite>
				</blockquote>

				<div className="cs-cta">
					<div className="cs-cta-h">
						Same challenge in <em>your building?</em>
					</div>
					<p>
						Flat-rate pricing from $175, COIs handled, same-week availability. Check{" "}
						<Link href="/pricing-availability">pricing &amp; availability</Link> or request your
						quote now.
					</p>
					<Link href="/quote" className="cs-cta-btn">
						Get your quote →
					</Link>
				</div>

				<div className="cs-related">
					<div className="cs-related-head">More case studies</div>
					{related.map((s) => (
						<Link key={s.slug} href={`/case-studies/${s.slug}`}>
							{s.title} →
						</Link>
					))}
				</div>
			</article>
		</div>
	);
}
