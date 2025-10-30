import type { Metadata } from "next";
import "./globals.css";
import SEOJsonLd from "./seo-jsonld";

export const metadata: Metadata = {
  title: {
    default: "Manhattan Mint | Home Cleaning NYC",
    template: "%s | Manhattan Mint",
  },
  description:
    "Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt.",
  metadataBase: new URL("https://www.manhattanmintnyc.com"),
  openGraph: {
    title: "Manhattan Mint | Home Cleaning NYC",
    description:
      "Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt.",
    url: "https://www.manhattanmintnyc.com",
    siteName: "Manhattan Mint",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manhattan Mint | Home Cleaning NYC",
    description:
      "Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [{ url: "/manhattan-mint-logo.png" }],
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
        <SEOJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="canonical" href="https://www.manhattanmintnyc.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Manhattan Mint | Home Cleaning NYC" />
        <meta property="og:description" content="Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt." />
        <meta property="og:url" content="https://www.manhattanmintnyc.com/" />
        <meta property="og:image" content="https://www.manhattanmintnyc.com/opengraph-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Manhattan Mint | Home Cleaning NYC" />
        <meta name="twitter:description" content="Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt." />
        <meta name="twitter:image" content="https://www.manhattanmintnyc.com/twitter-image.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
