import type { Metadata } from "next";
import Link from "next/link";
import { servicePages } from "./data";
import "../case-studies/case-studies.css";

export const metadata: Metadata = {
	title: "Cleaning Services — Apartment, Deep & Move-Out Cleaning NYC",
	description:
		"Manhattan Mint's three services: standard apartment cleaning from $175, deep cleaning (+$75) and move-in/move-out cleaning (+$100). Flat rates, supplies included, charged after the clean.",
	alternates: { canonical: "/services" },
};

export default function ServicesIndexPage() {
	return (
		<div className="cs-page">
			<div className="cs-eye">Services</div>
			<h1 className="cs-h1">
				Three cleans.<br />
				<em>One checklist.</em>
			</h1>
			<p className="cs-lede">
				Everything we do runs on the 59-point Mint Mark checklist; the service you pick decides how far
				down it we go. Flat rates, supplies included, and your card is charged only after the clean.
			</p>

			<div className="cs-index-grid">
				{servicePages.map((s) => (
					<Link key={s.slug} href={`/services/${s.slug}`} className="cs-index-card">
						<span className="cs-meta">{s.price.from} · {s.price.note.split(" · ")[0]}</span>
						<h2 className="cs-card-title">{s.name}</h2>
						<p className="cs-card-excerpt">{s.lede}</p>
						<span className="cs-read-more">See what&apos;s included →</span>
					</Link>
				))}
			</div>

			<div className="cs-related">
				<h2 className="cs-related-head">Not sure which one?</h2>
				<Link href="/#pricing">Price your apartment and pick a service on the home page →</Link>
				<Link href="/faq">Read the questions we get before every booking →</Link>
			</div>
		</div>
	);
}
