import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Second Clean on Us — Book by October 31",
	description:
		"Book your first Manhattan Mint clean by October 31, 2026 and your second standard clean of the same apartment is free within 60 days. New clients only. Background-checked, insured cleaners, photo summary after every visit.",
	alternates: { canonical: "/second-clean" },
};

export default function SecondCleanLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
