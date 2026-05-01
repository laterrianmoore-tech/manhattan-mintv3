"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ThankYouPage() {
  const [name, setName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("mm_name") || "";
    setName(storedName);

    const keysToClear = [
      "mm_name",
      "mm_email",
      "mm_phone",
      "mm_address",
      "mm_size",
      "mm_service",
      "mm_date",
    ];
    keysToClear.forEach((key) => localStorage.removeItem(key));
  }, []);

  return (
    <main style={{ background: "var(--soft)", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 1rem 5rem", textAlign: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "999px",
            margin: "0 auto 1.2rem",
            background: "var(--mint)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: "2rem",
            fontWeight: 700,
          }}
        >
          ✓
        </div>

        <p style={{ color: "var(--mint)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.72rem", marginBottom: "0.65rem" }}>
          You&apos;re booked
        </p>
        <h1 style={{ color: "var(--dark)", fontFamily: "DM Serif Display, serif", fontWeight: 400, fontSize: "clamp(2rem,4vw,3rem)", margin: "0 0 0.55rem" }}>
          See you soon, {name || "there"}.
        </h1>
        <p style={{ color: "var(--gray)", marginBottom: "1rem", fontWeight: 300 }}>
          Check your email for confirmation details.
        </p>

        <p style={{ color: "var(--dark)", marginBottom: "2rem", fontWeight: 500 }}>
          Thanks {name || "there"}, you&apos;re all set.
        </p>

        <Link
          href="/"
          style={{
            background: "var(--mint)",
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1.2rem",
            borderRadius: "8px",
            display: "inline-block",
            fontWeight: 500,
          }}
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
