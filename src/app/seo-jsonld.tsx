"use client";

// LocalBusiness JSON-LD component
// Renders structured data for SEO in the document head
export default function SEOJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Manhattan Mint",
    url: "https://www.manhattanmintnyc.com",
    description:
      "Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt.",
    areaServed: {
      "@type": "City",
      name: "New York City",
    },
    image: [
      "https://www.manhattanmintnyc.com/opengraph-image.png",
      "https://www.manhattanmintnyc.com/twitter-image.png",
    ],
    logo: "https://www.manhattanmintnyc.com/manhattan-mint-logo.png",
  } as const;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
