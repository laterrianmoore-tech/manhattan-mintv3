import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "./data";
import "../case-studies/case-studies.css";

const SITE = "https://manhattanmintnyc.com";

export const metadata: Metadata = {
	title: "Blog — Manhattan Cleaning Guides",
	description:
		"Practical guides to keeping a Manhattan apartment clean — co-op and condo building rules, small-space upkeep, and hiring the right cleaning service in NYC.",
	alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Blog",
		name: "Manhattan Mint Blog — Manhattan Cleaning Guides",
		url: `${SITE}/blog/`,
		description:
			"Practical guides to keeping a Manhattan apartment clean — co-op and condo building rules, seasonal upkeep, and hiring the right cleaning service in NYC.",
		publisher: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: SITE,
		},
		blogPost: blogPosts.map((post) => ({
			"@type": "BlogPosting",
			headline: post.title,
			url: `${SITE}/blog/${post.slug}/`,
			datePublished: post.publishedAt,
			dateModified: post.updatedAt ?? post.publishedAt,
		})),
	};

	return (
		<div className="cs-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<div className="cs-eye">Blog</div>
			<h1 className="cs-h1">
				Guides for keeping a<br />
				Manhattan apartment <em>mint.</em>
			</h1>
			<p className="cs-lede">
				Practical, NYC-specific advice — building rules, co-op paperwork, small-space upkeep,
				and how to hire well. No filler.
			</p>

			<div className="cs-index-grid">
				{blogPosts.map((post) => (
					<Link key={post.slug} href={`/blog/${post.slug}`} className="cs-index-card">
						<span className="cs-meta">
							{post.tag} ·{" "}
							{new Date(`${post.publishedAt}T12:00:00Z`).toLocaleDateString("en-US", {
								month: "long",
								year: "numeric",
							})}
						</span>
						<h2 className="cs-card-title">{post.title}</h2>
						<p className="cs-card-excerpt">{post.excerpt}</p>
						<span className="cs-read-more">Read the guide →</span>
					</Link>
				))}
			</div>

			<div className="cs-related">
				<h2 className="cs-related-head">Prefer proof over advice?</h2>
				<Link href="/case-studies">Browse our Manhattan case studies →</Link>
			</div>
		</div>
	);
}
