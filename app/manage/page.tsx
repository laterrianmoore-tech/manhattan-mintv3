"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Self-serve "move or skip this visit" page, reached from the signed link in
// the day-before reminder email (/manage/?b=<booking>&t=<token>).

type BookingView = {
  id: string;
  firstName: string;
  date: string;
  dateLabel: string;
  status: string;
  frequency: string | null;
  serviceSummary: string | null;
  timeRanges: string[];
  changeable: boolean;
  canSkip: boolean;
  skipTo: string | null;
  skipToLabel: string | null;
  minDate: string;
  maxDate: string;
};

const WINDOWS = [
  { label: "Morning", sub: "8am – 12pm" },
  { label: "Midday", sub: "10am – 2pm" },
  { label: "Afternoon", sub: "12pm – 4pm" },
  { label: "Evening", sub: "4pm – 7pm" },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid rgba(0,0,0,.15)",
  borderRadius: 8,
  padding: ".6rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  background: "#fff",
};

export default function ManageBookingPage() {
  const [params, setParams] = useState<{ b: string; t: string } | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [ranges, setRanges] = useState<string[]>([]);
  const [busy, setBusy] = useState<"move" | "skip" | null>(null);
  const [done, setDone] = useState<{ action: string; booking: BookingView } | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const b = (sp.get("b") || "").trim();
    const t = (sp.get("t") || "").trim();
    setParams({ b, t });
    if (!b || !t) {
      setError("This link is missing its key. Open it from your reminder email, or text (914) 863-7902.");
      setLoading(false);
      return;
    }
    fetch(`/api/bookings/manage/?b=${encodeURIComponent(b)}&t=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error(j.error || "Couldn't load your visit.");
        setBooking(j.booking);
        setRanges(j.booking.timeRanges || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(action: "reschedule" | "skip") {
    if (!params || !booking) return;
    setBusy(action === "skip" ? "skip" : "move");
    setError(null);
    try {
      const r = await fetch("/api/bookings/manage/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: params.b, token: params.t, action, newDate, newTimeRanges: ranges }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "That didn't save.");
      setDone({ action, booking: j.booking || booking });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1.25rem" };

  return (
    <main style={{ minHeight: "70vh", background: "var(--soft, #F8F8F6)", fontFamily: "'DM Sans', sans-serif", color: "#0F0F0F" }}>
      <section style={{ maxWidth: 620, margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>
        <p style={{ color: "var(--mint, #1D9E75)", letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".72rem", marginBottom: ".6rem" }}>Your visit</p>

        {loading ? (
          <p style={{ color: "#666" }}>Loading your visit…</p>
        ) : done ? (
          <div style={card}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "1.9rem", margin: "0 0 .6rem" }}>
              {done.action === "skip" ? "Skipped. " : "Moved. "}
              <em style={{ color: "var(--mint-dark, #157a5a)" }}>See you {done.booking.dateLabel}.</em>
            </h1>
            <p style={{ color: "#444", lineHeight: 1.6, margin: 0 }}>
              {done.booking.timeRanges.length ? `Window: ${done.booking.timeRanges.join(", ")}. ` : ""}
              We&apos;ve updated your cleaner and you&apos;ll get a fresh reminder the day before. Need anything else? Text{" "}
              <a href="sms:+19148637902" style={{ color: "var(--mint-dark, #157a5a)", fontWeight: 500 }}>(914) 863-7902</a>.
            </p>
          </div>
        ) : !booking ? (
          <div style={card}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "1.8rem", margin: "0 0 .6rem" }}>We couldn&apos;t open that.</h1>
            <p style={{ color: "#444", lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.5rem)", margin: "0 0 .4rem", lineHeight: 1.1 }}>
              Hi {booking.firstName}, your clean is <em style={{ color: "var(--mint-dark, #157a5a)" }}>{booking.dateLabel}</em>.
            </h1>
            <p style={{ color: "#666", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              {booking.serviceSummary ? `${booking.serviceSummary}. ` : ""}
              {booking.timeRanges.length ? `Window: ${booking.timeRanges.join(", ")}. ` : ""}
              {booking.frequency && !/one/i.test(booking.frequency) ? `${booking.frequency} plan.` : ""}
            </p>

            {!booking.changeable ? (
              <div style={card}>
                <p style={{ color: "#444", lineHeight: 1.6, margin: 0 }}>
                  This visit can&apos;t be changed online any more. Text{" "}
                  <a href="sms:+19148637902" style={{ color: "var(--mint-dark, #157a5a)", fontWeight: 500 }}>(914) 863-7902</a> and we&apos;ll sort it out.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={card}>
                  <h2 style={{ fontSize: "1.1rem", margin: "0 0 .75rem" }}>Move it to another day</h2>
                  <label style={{ display: "grid", gap: ".3rem", marginBottom: ".85rem" }}>
                    <span style={{ fontSize: ".75rem", color: "#666" }}>New date</span>
                    <input type="date" min={booking.minDate} max={booking.maxDate} value={newDate} onChange={(e) => setNewDate(e.target.value)} style={fieldStyle} />
                  </label>
                  <p style={{ fontSize: ".75rem", color: "#666", margin: "0 0 .4rem" }}>Arrival window <span style={{ color: "#aaa" }}>(pick all that work)</span></p>
                  <div style={{ display: "grid", gap: ".5rem", gridTemplateColumns: "repeat(2, minmax(0,1fr))", marginBottom: "1rem" }}>
                    {WINDOWS.map((w) => {
                      const on = ranges.includes(w.label);
                      return (
                        <button
                          key={w.label}
                          type="button"
                          onClick={() => setRanges(on ? ranges.filter((r) => r !== w.label) : [...ranges, w.label])}
                          style={{
                            borderRadius: 8,
                            padding: ".55rem .6rem",
                            border: `1px solid ${on ? "var(--mint, #1D9E75)" : "rgba(0,0,0,.15)"}`,
                            background: on ? "var(--mint, #1D9E75)" : "#fff",
                            color: on ? "#fff" : "#0F0F0F",
                            fontSize: ".84rem",
                            lineHeight: 1.3,
                            fontFamily: "inherit",
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{w.label}</div>
                          <div style={{ fontSize: ".72rem", opacity: 0.85 }}>{w.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!newDate || busy !== null}
                    onClick={() => submit("reschedule")}
                    style={{ background: "var(--mint, #1D9E75)", color: "#fff", border: 0, borderRadius: 10, padding: ".8rem 1.2rem", fontSize: "1rem", fontWeight: 500, fontFamily: "inherit", opacity: !newDate || busy ? 0.6 : 1 }}
                  >
                    {busy === "move" ? "Saving…" : "Move my visit"}
                  </button>
                </div>

                {booking.canSkip ? (
                  <div style={card}>
                    <h2 style={{ fontSize: "1.1rem", margin: "0 0 .4rem" }}>Skip this one, keep the plan</h2>
                    <p style={{ color: "#444", lineHeight: 1.6, margin: "0 0 .85rem", fontSize: ".95rem" }}>
                      Your next visit moves to <strong>{booking.skipToLabel}</strong>, same window, same cleaner. No charge for the skipped visit.
                    </p>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => submit("skip")}
                      style={{ background: "#fff", color: "#0F0F0F", border: "1px solid rgba(0,0,0,.2)", borderRadius: 10, padding: ".75rem 1.1rem", fontSize: ".95rem", fontWeight: 500, fontFamily: "inherit" }}
                    >
                      {busy === "skip" ? "Saving…" : `Skip ${booking.dateLabel}`}
                    </button>
                  </div>
                ) : null}

                {error ? <p style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}
                <p style={{ color: "#888", fontSize: ".8rem", lineHeight: 1.6, margin: 0 }}>
                  Changes inside 24 hours carry a $50 fee, because your cleaner has held that slot. Anything else, text{" "}
                  <a href="sms:+19148637902" style={{ color: "var(--mint-dark, #157a5a)" }}>(914) 863-7902</a> or see our <Link href="/terms" style={{ color: "var(--mint-dark, #157a5a)" }}>terms</Link>.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
