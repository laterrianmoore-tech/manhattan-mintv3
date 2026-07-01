import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../data";
import "../../case-studies/case-studies.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
	return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = blogPosts.find((p) => p.slug === slug);
	if (!post) return {};
	return {
		title: post.title,
		description: post.metaDescription,
		alternates: { canonical: `/blog/${post.slug}` },
		openGraph: {
			title: `${post.title} | Manhattan Mint`,
			description: post.metaDescription,
			type: "article",
			publishedTime: post.publishedAt,
		},
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = blogPosts.find((p) => p.slug === slug);
	if (!post) notFound();

	const publishedDate = new Date(`${post.publishedAt}T12:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: post.title,
		description: post.metaDescription,
		datePublished: post.publishedAt,
		author: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: "https://manhattanmintnyc.com",
		},
		publisher: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: "https://manhattanmintnyc.com",
		},
		mainEntityOfPage: `https://manhattanmintnyc.com/blog/${post.slug}/`,
	};

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
					<span>{publishedDate}</span>
				</div>

				{post.intro.map((paragraph, index) => (
					<p key={index}>{paragraph}</p>
				))}

				{post.sections.map((section) => (
					<section key={section.heading}>
						<h2 className="cs-section-head">{section.heading}</h2>
						{section.paragraphs.map((paragraph, index) => (
							<p key={index}>{paragraph}</p>
						))}
						{section.list && (
							<ul className="cs-results">
								{section.list.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						)}
					</section>
				))}

				<div className="cs-cta">
					<div className="cs-cta-h">
						Live in a co-op? <em>We speak board.</em>
					</div>
					<p>
						COIs issued before your first visit, service elevators booked for you, flat rates
						from $175. See the real thing in our{" "}
						<Link href="/case-studies/co-op-coi-cleaning-upper-east-side">
							Upper East Side co-op case study
						</Link>
						.
					</p>
					<Link href="/quote" className="cs-cta-btn">
						Get your quote →
					</Link>
				</div>

				<div className="cs-related">
					<div className="cs-related-head">Keep reading</div>
					<Link href="/case-studies">Manhattan cleaning case studies →</Link>
					<Link href="/pricing-availability">Pricing &amp; availability →</Link>
				</div>
			</article>
		</div>
	);
}
