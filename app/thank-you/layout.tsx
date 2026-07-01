import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Booking Received",
	description: "Your Manhattan Mint booking request has been received — here's what happens next.",
	robots: { index: false },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
