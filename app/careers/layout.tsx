import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Come Work With Us — Cleaner Application",
	description:
		"Apply to clean with Manhattan Mint NYC. Manhattan-only apartment cleaning, weekly pay, background-checked team, flexible days. Send your name, contact details, years of experience and resume.",
	alternates: { canonical: "/careers" },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
