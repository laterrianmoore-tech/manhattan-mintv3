import type { Metadata } from "next";
import Link from "next/link";
import { faqGroups } from "./data";
import { renderInline } from "../blog/inline-links";
import "../case-studies/case-studies.css";
import "./faq.css";

const SITE = "https://manhattanmintnyc.com";

export const metadata: Metadata = {
	title: "FAQ — NYC Apartment Cleaning Questions Answered",
	description:
		"Straight answers on Manhattan Mint pricing, what's included, COIs for co-ops and condos, cancellations, payment, and our re-clean guarantee.",
	alternates: { canonical: "/faq" },
};

// Markdown-style links in answers become plain text for the FAQPage schema.
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export default function FaqPage() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqGroups.flatMap((g) =>
			g.items.map((item) => ({
				"@type": "Question",
				name: item.q,
				acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
			})),
		),
	};
	const total = faqGroups.reduce((n, g) => n + g.items.length, 0);

	return (
		<div className="cs-page faq-page">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<div className="cs-eye">FAQ</div>
			<h1 className="cs-h1">
				The questions we get<br />
				<em>before every booking.</em>
			</h1>
			<p className="cs-lede">
				These are the {total} things clients actually text us before they book: prices, what&apos;s included,
				building rules, payment, and what happens if something isn&apos;t right. If yours isn&apos;t here, text{" "}
				<a href="tel:9148637902">(914) 863-7902</a> and a person will answer.
			</p>

			<nav className="faq-nav" aria-label="FAQ sections">
				{faqGroups.map((g) => (
					<a key={g.id} href={`#${g.id}`}>
						{g.title}
					</a>
				))}
			</nav>

			<div className="faq-groups">
				{faqGroups.map((g) => (
					<section key={g.id} id={g.id} className="faq-group">
						<h2 className="faq-group-title">{g.title}</h2>
						<div className="faq-list">
							{g.items.map((item) => (
								<details key={item.q} className="faq-d">
									<summary>
										<span>{item.q}</span>
										<span className="faq-plus" aria-hidden="true" />
									</summary>
									<p>{renderInline(item.a)}</p>
								</details>
							))}
						</div>
					</section>
				))}
			</div>

			<div className="cs-cta">
				<h2 className="cs-cta-h">
					Still have a question? <em>Ask a person.</em>
				</h2>
				<p>
					We&apos;re owner-run, and we pick up. Text or call{" "}
					<a href="tel:9148637902">(914) 863-7902</a>, or email{" "}
					<a href="mailto:hello@manhattanmintnyc.com">hello@manhattanmintnyc.com</a>. Ready to go? See your
					exact price on the home page and book in 60 seconds.
				</p>
				<Link href="/#pricing" className="cs-cta-btn">
					See your price →
				</Link>
			</div>
		</div>
	);
}
