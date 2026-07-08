import type { Metadata } from "next";
import Link from "next/link";
import { caseStudies } from "./data";
import "./case-studies.css";

const SITE = "https://manhattanmintnyc.com";

export const metadata: Metadata = {
	title: "Manhattan Cleaning Case Studies",
	description:
		"Real cleaning case studies from Manhattan apartments — pre-war walk-ups, co-op COI requirements, small spaces, and lofts. See how Manhattan Mint handles NYC's unique cleaning challenges.",
	alternates: { canonical: "/case-studies" },
	openGraph: {
		title: "Manhattan Cleaning Case Studies | Manhattan Mint",
		description:
			"Real cleaning case studies from Manhattan apartments — pre-war walk-ups, co-op COI requirements, small spaces, and lofts.",
	},
};

export default function CaseStudiesPage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Manhattan Cleaning Case Studies",
		url: `${SITE}/case-studies/`,
		description:
			"Real cleaning case studies from Manhattan apartments — pre-war walk-ups, co-op COI requirements, small spaces, and lofts.",
		publisher: {
			"@type": "Organization",
			name: "Manhattan Mint",
			url: SITE,
		},
		mainEntity: {
			"@type": "ItemList",
			itemListElement: caseStudies.map((study, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: study.title,
				url: `${SITE}/case-studies/${study.slug}/`,
			})),
		},
	};

	return (
		<div className="cs-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<div className="cs-eye">Case studies</div>
			<h1 className="cs-h1">
				Cleaning Manhattan is <em>different.</em>
				<br />
				Here&apos;s the proof.
			</h1>
			<p className="cs-lede">
				Pre-war radiators, co-op boards that demand a COI before anyone touches the lobby,
				450-square-foot apartments where every surface doubles as storage. These case studies
				show how we handle the challenges that only exist in Manhattan homes.
			</p>

			<div className="cs-index-grid">
				{caseStudies.map((study) => (
					<Link key={study.slug} href={`/case-studies/${study.slug}`} className="cs-index-card">
						<span className="cs-meta">
							{study.neighborhood} · {study.propertyType} · {study.service}
						</span>
						<h2 className="cs-card-title">{study.title}</h2>
						<p className="cs-card-excerpt">{study.excerpt}</p>
						<span className="cs-read-more">Read the case study →</span>
					</Link>
				))}
			</div>

			<div className="cs-cta">
				<h2 className="cs-cta-h">
					Your apartment could be <em>the next one.</em>
				</h2>
				<p>
					Flat-rate pricing from $175, same-week availability, and a team that already knows
					your building type. See <Link href="/#pricing">flat-rate pricing</Link> or get started below.
				</p>
				<Link href="/quote" className="cs-cta-btn">
					Get your quote →
				</Link>
			</div>
		</div>
	);
}
