"use client";

import { Suspense, useEffect, useState } from "react";
import PricingAvailabilityClient from "../../src/app/pricing-availability/PricingAvailabilityClient";

type BookingSummary = {
  name: string;
  address: string;
  size: string;
};

export default function PricingAvailabilityPage() {
  const [summary, setSummary] = useState<BookingSummary>({ name: "", address: "", size: "" });

  useEffect(() => {
    setSummary({
      name: localStorage.getItem("mm_name") || "",
      address: localStorage.getItem("mm_address") || "",
      size: localStorage.getItem("mm_size") || "",
    });
  }, []);

  return (
    <main style={{ background: "var(--soft)", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "3rem 1rem 1rem" }}>
        <p style={{ color: "var(--mint)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.72rem", marginBottom: "0.65rem" }}>
          Step 3 of 3
        </p>
        <h1 style={{ color: "var(--dark)", fontFamily: "DM Serif Display, serif", fontWeight: 400, fontSize: "clamp(2rem,4vw,3rem)", margin: "0 0 0.55rem" }}>
          Confirm &amp; pay.
        </h1>
        <p style={{ color: "var(--gray)", marginBottom: "1rem", fontWeight: 300 }}>
          Review your details and complete your booking.
        </p>

        <div style={{ background: "var(--mint-light)", color: "var(--mint-dark)", border: "1px solid rgba(29,158,117,.25)", borderRadius: "10px", padding: "0.75rem 0.95rem", marginBottom: "1rem", fontSize: "0.92rem" }}>
          Booking for {summary.name || "-"} · {summary.address || "-"} · {summary.size || "-"}
        </div>
      </section>

      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <PricingAvailabilityClient />
      </Suspense>
    </main>
  );
}