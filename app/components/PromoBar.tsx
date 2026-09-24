"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Site-wide promo strip for "Second Clean on Us" (landing page /second-clean).
// Rendered client-side so it hides itself after the end date without a deploy,
// and stays off the landing page itself. Swap END/COPY for the next promo.
const END = "2026-10-31";

export default function PromoBar() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(new Date().toISOString().slice(0, 10) <= END);
  }, []);
  if (!show || pathname?.startsWith("/second-clean") || pathname?.startsWith("/cleaner") || pathname?.startsWith("/admin")) return null;
  return (
    <Link href="/second-clean" className="promo-bar" aria-label="Second clean on us: book your first clean by October 31 and the second is free">
      <span className="promo-bar-tag">Fall offer</span>
      <span className="promo-bar-text">
        <strong>Second clean on us.</strong> Book your first clean by Oct 31 and the second one is free.
      </span>
      <span className="promo-bar-cta">See how it works →</span>
    </Link>
  );
}
