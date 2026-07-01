import type { Metadata } from "next";
import Link from "next/link";
import { caseStudies } from "./data";
import "./case-studies.css";

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
	return (
		<div className="cs-page">
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
						<div className="cs-card-title">{study.title}</div>
						<p className="cs-card-excerpt">{study.excerpt}</p>
						<span className="cs-read-more">Read the case study →</span>
					</Link>
				))}
			</div>

			<div className="cs-cta">
				<div className="cs-cta-h">
					Your apartment could be <em>the next one.</em>
				</div>
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
