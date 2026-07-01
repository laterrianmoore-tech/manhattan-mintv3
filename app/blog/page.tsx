import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "./data";
import "../case-studies/case-studies.css";

export const metadata: Metadata = {
	title: "Blog — Manhattan Cleaning Guides",
	description:
		"Practical guides to keeping a Manhattan apartment clean — co-op and condo building rules, small-space upkeep, and hiring the right cleaning service in NYC.",
	alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
	return (
		<div className="cs-page">
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
						<div className="cs-card-title">{post.title}</div>
						<p className="cs-card-excerpt">{post.excerpt}</p>
						<span className="cs-read-more">Read the guide →</span>
					</Link>
				))}
			</div>

			<div className="cs-related">
				<div className="cs-related-head">Prefer proof over advice?</div>
				<Link href="/case-studies">Browse our Manhattan case studies →</Link>
			</div>
		</div>
	);
}
