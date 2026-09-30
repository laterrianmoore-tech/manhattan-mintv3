"use client";

// LocalBusiness JSON-LD component
// Renders structured data for SEO in the document head
export default function SEOJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Manhattan Mint",
    url: "https://manhattanmintnyc.com",
    description:
      "Luxury home cleaning for busy New Yorkers — insured, building-friendly, and fully digital from booking to receipt.",
    telephone: "+1-914-863-7902",
    email: "hello@manhattanmintnyc.com",
    sameAs: ["https://share.google/ZE4GZwjFnRtf9SZTU"],
    priceRange: "$175+",
    areaServed: {
      "@type": "City",
      name: "New York City",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "New York",
      addressRegion: "NY",
      addressCountry: "US",
    },
    // Google prefers a square logo (>=112px, ideally 1:1) for the search
    // knowledge panel; the wide image stays as the general business image.
    image: [
      "https://manhattanmintnyc.com/brand/square",
      "https://manhattanmintnyc.com/opengraph-image",
    ],
    logo: "https://manhattanmintnyc.com/brand/square",
    brand: {
      "@type": "Brand",
      name: "Manhattan Mint",
      logo: "https://manhattanmintnyc.com/brand/square",
    },
  } as const;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
