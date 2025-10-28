import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Manhattan Mint | Cleaning",
    template: "%s | Manhattan Mint",
  },
  description:
    "Flawless Clean. Every Time. Premium home cleaning for busy New Yorkers — flat-rate pricing, COI-ready, doorman/key handling, and digital receipts.",
  metadataBase: new URL("https://www.manhattanmintnyc.com"),
  openGraph: {
    title: "Manhattan Mint | Cleaning",
    description:
      "Flawless Clean. Every Time. Premium home cleaning for busy New Yorkers.",
    url: "https://www.manhattanmintnyc.com",
    siteName: "Manhattan Mint",
    type: "website",
    images: ["/og-image.jpg"], // ✅ adds your new logo-based OG image
  },
  twitter: {
    card: "summary_large_image",
    title: "Manhattan Mint | Cleaning",
    description:
      "Flawless Clean. Every Time. Premium home cleaning for busy New Yorkers.",
    images: ["/og-image.jpg"], // ✅ same image for Twitter cards
  },
  icons: {
    icon: [{ url: "/manhattan-mint-logo.png" }], // use existing logo as favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="canonical" href="https://www.manhattanmintnyc.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Manhattan Mint | Cleaning" />
        <meta property="og:description" content="Premium home cleaning for busy New Yorkers — flat-rate pricing, COI-ready, and 60-second booking." />
        <meta property="og:url" content="https://www.manhattanmintnyc.com/" />
        <meta property="og:image" content="https://www.manhattanmintnyc.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Manhattan Mint | Cleaning" />
        <meta name="twitter:description" content="Premium home cleaning for busy New Yorkers — flat-rate pricing, COI-ready, and 60-second booking." />
        <meta name="twitter:image" content="https://www.manhattanmintnyc.com/og-image.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
