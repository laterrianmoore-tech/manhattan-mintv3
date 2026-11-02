"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { activePromo, todayISO } from "@/lib/promo";

// Site-wide promo strip. Through Oct 31 it carries "Second Clean on Us"
// (landing page /second-clean); from Nov 1 to Dec 23 it carries the holiday
// code INLAWS (dates in src/lib/promo.ts). Rendered client-side so it switches
// and hides itself on the right day without a deploy, and stays off the
// landing page, cleaner portal and admin.
//
// Base styles live in src/app/layout.tsx (.promo-bar*). A season may add a
// `variant` class; its overrides live in the <style> block below so the bar
// matches that season's popup (EmailCaptureModal.tsx) instead of inheriting
// whatever color the last season used.
const SECOND_END = "2026-10-31";

type Bar = { href: string; tag: string; strong: string; text: string; cta: string; label: string; variant?: "holiday" };

function barForToday(today: string): Bar | null {
  if (today <= SECOND_END) {
    return {
      href: "/second-clean",
      tag: "Fall offer",
      strong: "Second clean on us.",
      text: " Book your first clean by Oct 31 and the second one is free.",
      cta: "See how it works →",
      label: "Second clean on us: book your first clean by October 31 and the second is free",
    };
  }
  const p = activePromo(today);
  if (p?.code === "INLAWS") {
    return {
      href: `/quote/?code=${p.code}`,
      tag: "Holiday offer",
      strong: "Guest Room Emergency.",
      text: ` $${p.amount} off your first clean with code ${p.code}, through Dec 23.`,
      cta: "Book before they land →",
      label: `Guest Room Emergency: $${p.amount} off your first clean with code ${p.code} through December 23`,
      variant: "holiday",
    };
  }
  return null;
}

export default function PromoBar() {
  const pathname = usePathname();
  const [bar, setBar] = useState<Bar | null>(null);
  useEffect(() => {
    setBar(barForToday(todayISO()));
  }, []);
  if (!bar || pathname?.startsWith("/second-clean") || pathname?.startsWith("/cleaner") || pathname?.startsWith("/admin")) return null;
  const className = bar.variant ? `promo-bar promo-bar--${bar.variant}` : "promo-bar";
  return (
    <>
      {bar.variant === "holiday" && (
        <style>{`
          .promo-bar.promo-bar--holiday{background:linear-gradient(90deg,#0a2419,#123b2c 50%,#0a2419);}
          .promo-bar--holiday .promo-bar-tag{color:#e8c47c;border-color:rgba(232,196,124,.5);}
          .promo-bar--holiday .promo-bar-cta{color:#e8c47c;}
        `}</style>
      )}
      <Link href={bar.href} className={className} aria-label={bar.label}>
        <span className="promo-bar-tag">{bar.tag}</span>
        <span className="promo-bar-text">
          <strong>{bar.strong}</strong>{bar.text}
        </span>
        <span className="promo-bar-cta">{bar.cta}</span>
      </Link>
    </>
  );
}
