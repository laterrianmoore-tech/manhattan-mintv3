import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import SEOJsonLd from "./seo-jsonld";
import ChatWidget from "@/components/ChatWidget";
import PromoBar from "../../app/components/PromoBar";

export const metadata: Metadata = {
  title: {
    default: "Luxury Home Cleaning NYC | Manhattan Mint",
    template: "%s | Manhattan Mint",
  },
  description:
    "Luxury, eco-friendly apartment cleaning across Manhattan. Flat rates from $175, background-checked cleaners, next-day availability — same-day cleans by phone when the schedule allows.",
  metadataBase: new URL("https://manhattanmintnyc.com"),
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Luxury Home Cleaning NYC | Manhattan Mint",
    description:
      "Luxury, eco-friendly apartment cleaning across Manhattan. Flat rates from $175, background-checked cleaners, next-day availability — same-day cleans by phone when the schedule allows.",
    url: "https://manhattanmintnyc.com",
    siteName: "Manhattan Mint",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Home Cleaning NYC | Manhattan Mint",
    description:
      "Luxury, eco-friendly apartment cleaning across Manhattan. Flat rates from $175, background-checked cleaners, next-day availability — same-day cleans by phone when the schedule allows.",
    images: ["/opengraph-image"],
  },
};

function TrustTicker() {
  const items = [
    "Fully Insured",
    "5-Star Local Team",
    "No Hidden Fees",
    "Building-Friendly Pros",
    "Eco-Friendly Supplies",
  ];

  return (
    <div className="trust-ticker" aria-label="Trust highlights">
      <div className="trust-track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} className="trust-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const links = [
    { href: "/#services", label: "Services" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#areas", label: "Areas" },
    { href: "/case-studies", label: "Case studies" },
    { href: "/#reviews", label: "Reviews" },
  ];

  return (
    <header className="site-header">
      <PromoBar />
      <TrustTicker />
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav-inner">
          <Link href="/" className="brand" aria-label="Manhattan Mint home">
            <span>manhattan</span>
            <span className="brand-mint">mint</span>
          </Link>

          <ul className="nav-links">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <a className="phone-btn" href="tel:+19148637902">
              (914) 863-7902
            </a>
            <Link className="book-btn" href="/#booking">
              Book a clean
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div>
          <p className="footer-brand">
            manhattan<span>mint</span>
          </p>
          <p className="footer-tagline">Flawless clean. Honest service. True to New York.</p>
        </div>

        <div className="footer-columns">
          <div>
            <p className="footer-heading">Services</p>
            <ul>
              <li>
                <Link href="/#services">Home Cleaning</Link>
              </li>
              <li>
                <Link href="/#services">Deep Cleaning</Link>
              </li>
              <li>
                <Link href="/#services">Move In/Out</Link>
              </li>
              <li>
                <Link href="/#pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/#checklist">What&apos;s included</Link>
              </li>
              <li>
                <Link href="/second-clean">Second Clean on Us</Link>
              </li>
              <li>
                <Link href="/quote">Get a Quote</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-heading">Company</p>
            <ul>
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
              <li>
                <Link href="/case-studies">Case Studies</Link>
              </li>
              <li>
                <Link href="/brokers">For Brokers &amp; Agents</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/#reviews">Reviews</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-heading">Contact</p>
            <ul>
              <li>
                <a href="tel:+19148637902">(914) 863-7902</a>
              </li>
              <li>
                <a href="mailto:hello@manhattanmintnyc.com">hello@manhattanmintnyc.com</a>
              </li>
              <li>
                <Link href="/#areas">Service Areas</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Manhattan Mint NYC LLC. All rights reserved.</p>
        <div className="footer-social" aria-label="Manhattan Mint on social media">
          <a href="https://www.facebook.com/profile.php?id=61592530890151" target="_blank" rel="noopener noreferrer" aria-label="Manhattan Mint on Facebook" title="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22h3.4z" /></svg>
          </a>
          <a href="https://www.linkedin.com/company/manhattan-mint/" target="_blank" rel="noopener noreferrer" aria-label="Manhattan Mint on LinkedIn" title="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 21H2.7V8.6h3.7V21zM4.5 6.9a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zM21.3 21h-3.7v-6c0-1.4 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9.6V8.6h3.5v1.7h.1c.5-.9 1.7-1.9 3.5-1.9 3.7 0 4.4 2.5 4.4 5.6V21z" /></svg>
          </a>
          <a href="https://nextdoor.com/page/manhattan-mint/" target="_blank" rel="noopener noreferrer" aria-label="Manhattan Mint on Nextdoor" title="Nextdoor">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 3 9.6V21h6.2v-5.6a2.8 2.8 0 0 1 5.6 0V21H21V9.6L12 2.5zm0 2.6 6.9 5.4V19h-2.1v-3.6a4.8 4.8 0 0 0-9.6 0V19H5.1V10.5L12 5.1z" /></svg>
          </a>
        </div>
        <a href="tel:+19148637902">(914) 863-7902</a>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NRVHBJ27');`,
          }}
        />
        <SEOJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NRVHBJ27"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Nav />
        <main>{children}</main>
        <Footer />
        <ChatWidget />

        <style>{`
          :root {
            --mint: #1d9e75;
            --mint-light: #e1f5ee;
            --mint-dark: #085041;
            --dark: #0f0f0f;
            --charcoal: #1a1a1a;
            --gray: #888;
            --soft: #f8f8f6;
          }

          html,
          body {
            background: var(--soft);
            color: var(--charcoal);
            font-family: "DM Sans", sans-serif;
          }

          .site-header {
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .promo-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.9rem;
            flex-wrap: wrap;
            padding: 0.6rem 1rem;
            background: #0F0F0F;
            color: #fff;
            text-decoration: none;
            font-size: 0.86rem;
            line-height: 1.3;
          }
          .promo-bar:hover .promo-bar-cta { text-decoration: underline; }
          .promo-bar-tag {
            font-size: 0.64rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #f0a24a;
            border: 1px solid rgba(240,162,74,.45);
            border-radius: 999px;
            padding: 0.15rem 0.55rem;
          }
          .promo-bar-text { color: rgba(255,255,255,.85); }
          .promo-bar-text strong { color: #fff; font-weight: 600; }
          .promo-bar-cta { color: #7ed9b8; font-weight: 500; white-space: nowrap; }
          @media (max-width: 640px) { .promo-bar-tag { display: none; } .promo-bar { font-size: 0.8rem; gap: 0.5rem; } }

          .trust-ticker {
            background: var(--mint-dark);
            color: #fff;
            font-size: 0.78rem;
            letter-spacing: 0.04em;
            overflow: hidden;
            white-space: nowrap;
          }

          .trust-track {
            display: inline-flex;
            min-width: 200%;
            animation: ticker 26s linear infinite;
            padding: 0.45rem 0;
          }

          .trust-item {
            display: inline-block;
            margin-right: 2rem;
            opacity: 0.92;
          }

          .site-nav {
            backdrop-filter: blur(10px);
            background: rgba(248, 248, 246, 0.88);
            border-bottom: 1px solid rgba(8, 80, 65, 0.1);
          }

          .site-nav-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0.85rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }

          .brand {
            font-size: 1.35rem;
            font-weight: 500;
            letter-spacing: -0.02em;
            color: var(--charcoal);
            text-decoration: none;
            display: inline-flex;
            gap: 0.1rem;
            line-height: 1;
          }

          .brand-mint {
            color: var(--mint);
            font-family: "DM Serif Display", serif;
            font-style: italic;
          }

          .nav-links {
            list-style: none;
            margin: 0;
            padding: 0;
            display: none;
            align-items: center;
            gap: 1.1rem;
          }

          .nav-links a {
            color: var(--charcoal);
            text-decoration: none;
            font-weight: 400;
            font-size: 0.95rem;
          }

          .nav-links a:hover {
            color: var(--mint-dark);
          }

          .nav-cta {
            display: inline-flex;
            align-items: center;
            gap: 0.55rem;
          }

          .phone-btn,
          .book-btn {
            text-decoration: none;
            border-radius: 999px;
            font-size: 0.9rem;
            line-height: 1;
            padding: 0.66rem 0.95rem;
            font-weight: 500;
            transition: transform 0.2s ease, background-color 0.2s ease;
            white-space: nowrap;
          }

          .phone-btn {
            border: 1px solid rgba(8, 80, 65, 0.2);
            color: var(--charcoal);
            background: #fff;
          }

          .book-btn {
            background: var(--mint);
            color: #fff;
          }

          .phone-btn:hover,
          .book-btn:hover {
            transform: translateY(-1px);
          }

          .book-btn:hover {
            background: var(--mint-dark);
          }

          .site-footer {
            background: var(--dark);
            color: #f2f2f2;
            margin-top: 4rem;
          }

          .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 1rem 2rem;
            display: grid;
            gap: 2rem;
          }

          .footer-brand {
            margin: 0;
            font-size: 1.6rem;
            font-weight: 500;
            line-height: 1.1;
            letter-spacing: -0.02em;
            color: #fff;
          }

          .footer-brand span {
            color: var(--mint);
            font-family: "DM Serif Display", serif;
            font-style: italic;
          }

          .footer-tagline {
            margin: 0.75rem 0 0;
            color: #d7d7d7;
            max-width: 28ch;
            font-size: 0.95rem;
          }

          .footer-columns {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            gap: 1.5rem;
          }

          .footer-heading {
            margin: 0 0 0.75rem;
            color: #fff;
            font-weight: 500;
          }

          .footer-columns ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 0.55rem;
          }

          .footer-columns a {
            color: #c8c8c8;
            text-decoration: none;
            font-size: 0.93rem;
          }

          .footer-columns a:hover {
            color: var(--mint-light);
          }

          .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            color: var(--gray);
            font-size: 0.88rem;
          }

          .footer-social {
            display: flex;
            align-items: center;
            gap: 0.6rem;
          }
          .footer-social a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: rgba(255, 255, 255, 0.75);
            transition: border-color 0.2s, color 0.2s, background 0.2s;
          }
          .footer-social a:hover {
            color: #fff;
            border-color: var(--mint);
            background: rgba(29, 158, 117, 0.18);
          }
          .footer-social svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }
          .footer-bottom a {
            color: #d6d6d6;
            text-decoration: none;
          }

          @media (min-width: 960px) {
            .nav-links {
              display: inline-flex;
            }

            .site-nav-inner {
              padding: 0.95rem 1.25rem;
            }

            .footer-content {
              grid-template-columns: 1.2fr 2fr;
              padding: 3.5rem 1.25rem 2.25rem;
            }

            .footer-columns {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .footer-bottom {
              padding: 1rem 1.25rem 1.2rem;
            }
          }

          @media (max-width: 640px) {
            .phone-btn {
              display: none;
            }

            .book-btn {
              padding-inline: 0.85rem;
            }
          }

          @keyframes ticker {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </body>
    </html>
  );
}
