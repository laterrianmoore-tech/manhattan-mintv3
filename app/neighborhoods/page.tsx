import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { neighborhoods } from "./data";
import "../case-studies/case-studies.css";
import "./neighborhoods.css";

export const metadata: Metadata = {
	title: "Neighborhoods We Clean — Manhattan Apartment Cleaning by Area",
	description:
		"Manhattan Mint cleans across Manhattan: Upper East and West Side, Chelsea, West Village, Tribeca, SoHo, FiDi, Murray Hill, East Village, Flatiron. What we clean in each, and how we get in.",
	alternates: { canonical: "/neighborhoods" },
};

export default function NeighborhoodsIndexPage() {
	return (
		<div className="cs-page">
			<div className="cs-eye">Neighborhoods</div>
			<h1 className="cs-h1">
				All of Manhattan.<br />
				<em>Cleaned like we live here.</em>
			</h1>
			<p className="cs-lede">
				Every neighborhood has its own buildings, its own doormen, and its own dirt. Here&apos;s what we
				actually deal with in each one. Don&apos;t see yours? We cover all of Manhattan and parts of Brooklyn
				and Queens on request.
			</p>

			<div className="cs-index-grid nb-grid">
				{neighborhoods.map((n) => (
					<Link key={n.slug} href={`/neighborhoods/${n.slug}`} className={`cs-index-card${n.image ? " has-img" : ""}`}>
						{n.image && (
							<span className="cs-card-img">
								<Image src={n.image.src} alt={n.image.alt} fill sizes="(max-width: 760px) 100vw, 400px" />
							</span>
						)}
						<span className="cs-meta">{n.bounds}</span>
						<h2 className="cs-card-title">{n.name}</h2>
						<p className="cs-card-excerpt">{n.lede}</p>
						<span className="cs-read-more">What we clean here →</span>
					</Link>
				))}
			</div>

			<div className="cs-related">
				<h2 className="cs-related-head">Anywhere in Manhattan</h2>
				<Link href="/#pricing">Price your apartment and book in 60 seconds →</Link>
				<Link href="/services">See our three services →</Link>
			</div>
		</div>
	);
}
