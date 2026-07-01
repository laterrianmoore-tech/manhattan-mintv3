import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Get a Quote & Book Online",
	description:
		"Get a flat-rate quote and book your Manhattan apartment cleaning online in minutes. From $175 all-in — card saved securely, charged only after your clean.",
	alternates: { canonical: "/quote" },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
