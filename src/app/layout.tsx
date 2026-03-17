import type { Metadata } from "next";
import Link from "next/link";
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
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/manhattan-mint-logo.png", type: "image/png" },
    ],
    shortcut: [{ url: "/icon.png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
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
    { href: "/#reviews", label: "Reviews" },
  ];

  return (
    <header className="site-header">
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
            <a className="phone-btn" href="tel:+19148734430">
              (914) 873-4430
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
            </ul>
          </div>

          <div>
            <p className="footer-heading">Company</p>
            <ul>
              <li>
                <Link href="/#how-it-works">How it works</Link>
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
                <a href="tel:+19148734430">(914) 873-4430</a>
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
        <p>© {new Date().getFullYear()} Manhattan Mint. All rights reserved.</p>
        <a href="tel:+19148734430">(914) 873-4430</a>
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
        <SEOJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display:ital@1&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
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
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />

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
