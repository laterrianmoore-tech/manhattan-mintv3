import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../data";
import { renderInline } from "../inline-links";
import "../../case-studies/case-studies.css";

type Props = { params: Promise<{ slug: string }> };

const SITE = "https://manhattanmintnyc.com";

function formatDate(iso: string) {
	return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function generateStaticParams() {
	return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = blogPosts.find((p) => p.slug === slug);
	if (!post) return {};
	return {
		title: post.metaTitle,
		description: post.metaDescription,
		alternates: { canonical: `/blog/${post.slug}` },
		openGraph: {
			title: `${post.metaTitle} | Manhattan Mint`,
			description: post.metaDescription,
			type: "article",
			publishedTime: post.publishedAt,
			modifiedTime: post.updatedAt ?? post.publishedAt,
		},
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = blogPosts.find((p) => p.slug === slug);
	if (!post) notFound();

	const otherPosts = blogPosts.filter((p) => p.slug !== post.slug);

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "Article",
			headline: post.title,
			description: post.metaDescription,
			datePublished: post.publishedAt,
			dateModified: post.updatedAt ?? post.publishedAt,
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
			mainEntityOfPage: `${SITE}/blog/${post.slug}/`,
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
				{ "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog/` },
				{ "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}/` },
			],
		},
	];

	return (
		<div className="cs-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<article className="cs-article">
				<Link href="/blog" className="cs-back">
					← All guides
				</Link>
				<div className="cs-eye">{post.tag}</div>
				<h1 className="cs-h1">{post.title}</h1>
				<div className="cs-byline">
					<span>
						By <strong>the Manhattan Mint team</strong>
					</span>
					<span>
						Reviewed by <strong>the founder</strong>
					</span>
					<span>{formatDate(post.publishedAt)}</span>
					{post.updatedAt && <span>Updated {formatDate(post.updatedAt)}</span>}
				</div>

				{post.intro.map((paragraph, index) => (
					<p key={index}>{renderInline(paragraph)}</p>
				))}

				{post.sections.map((section) => (
					<section key={section.heading}>
						<h2 className="cs-section-head">{section.heading}</h2>
						{section.paragraphs.map((paragraph, index) => (
							<p key={index}>{renderInline(paragraph)}</p>
						))}
						{section.list && (
							<ul className="cs-results">
								{section.list.map((item, index) => (
									<li key={index}>{renderInline(item)}</li>
								))}
							</ul>
						)}
					</section>
				))}

				<aside className="cs-author">
					<h2 className="cs-author-head">Who writes these guides</h2>
					<p>
						Manhattan Mint is an owner-operated residential cleaning company working exclusively in
						Manhattan — pre-war walk-ups, doorman co-ops, and converted lofts across the borough. Our
						guides come from our cleaners&apos; first-hand field experience, and every article is
						reviewed by the founder, who still reads the photo summary from every completed job. The
						company is fully bonded and insured, COI-ready for co-op and condo buildings, and rated
						5.0 on Google.
					</p>
					<p className="cs-author-links">
						<Link href="/case-studies">See our work</Link> · <Link href="/#services">Services</Link>{" "}
						· <Link href="/quote">Get a quote</Link>
					</p>
				</aside>

				<div className="cs-cta">
					<h2 className="cs-cta-h">
						{post.cta.heading.split("|")[0]} <em>{post.cta.heading.split("|")[1]}</em>
					</h2>
					<p>
						{post.cta.body}{" "}
						<Link href={`/case-studies/${post.cta.caseStudySlug}`}>{post.cta.caseStudyLabel}</Link>.
					</p>
					<Link href="/quote" className="cs-cta-btn">
						Get your quote →
					</Link>
				</div>

				<div className="cs-related">
					<h2 className="cs-related-head">Keep reading</h2>
					{otherPosts.map((p) => (
						<Link key={p.slug} href={`/blog/${p.slug}`}>
							{p.title} →
						</Link>
					))}
					<Link href="/case-studies">Manhattan cleaning case studies →</Link>
					<Link href="/#pricing">Pricing &amp; what&apos;s included →</Link>
				</div>
			</article>
		</div>
	);
}
