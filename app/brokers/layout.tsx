import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "For Brokers & Agents — Move-In and Move-Out Cleaning Partner",
	description:
		"Manhattan Mint's partner program for real estate agents and rental brokers: a free clean of your own apartment, a referral fee on every booked job, 48-hour move-in and move-out turnaround, and a direct line to the owner.",
	alternates: { canonical: "/brokers" },
};

export default function BrokersLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
