import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service",
	description:
		"Manhattan Mint's terms of service — booking and cancellation policies, the 100% re-clean guarantee, payment terms, and building access rules.",
	alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
