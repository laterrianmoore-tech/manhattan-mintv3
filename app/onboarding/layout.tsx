import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Join Our Cleaning Team",
	description:
		"Apply to clean with Manhattan Mint — steady Manhattan jobs, fair pay per clean, and a fully digital dispatch system. Background check required.",
	alternates: { canonical: "/onboarding" },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
