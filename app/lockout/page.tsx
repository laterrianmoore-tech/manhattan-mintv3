"use client";

import { useEffect, useState } from "react";

// Owner's lockout page (2026-10-28), reached from the signed link in the
// "🚪 LOCKOUT" text: /lockout/?b=<booking>&t=<token>. Three outcomes, one
// tap each. The same actions live on the dispatch row; this is for the phone.

type View = {
  id: string;
  migrated: boolean;
  customerName: string;
  firstName: string;
  address: string;
  phone: string | null;
  email: string | null;
  dateLabel: string;
  cleanerName: string;
  status: string;
  price: number;
  lockedOutLabel: string | null;
  resolvedLabel: string | null;
  resolution: string | null;
  feeCents: number | null;
  open: boolean;
  hold: { amount?: number; captured?: number } | null;
  hasCard: boolean;
  fee: number;
  taxable: boolean;
};

const MINT = "#1d9e75";
const DARK = "#085041";

export default function LockoutPage() {
  const [creds, setCreds] = useState<{ b: string; t: string } | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const b = (sp.get("b") || "").trim();
    const t = (sp.get("t") || "").trim();
    if (!b || !t) {
      setError("This link is missing its key. Open it from the lockout text.");
      setLoading(false);
      return;
    }
    setCreds({ b, t });
    fetch(`/api/lockout/?b=${encodeURIComponent(b)}&t=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error(j.error || "Couldn't load the job.");
        setView(j.booking);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Minutes since the cleaner tapped "Can't get in", ticking.
  useEffect(() => {
    if (!view?.lockedOutLabel || !view.open) return;
    const start = Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 60000));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [view?.lockedOutLabel, view?.open]);

  async function act(action: "let_in" | "charge" | "waive", confirmText: string) {
    if (!creds || busy) return;
    if (!window.confirm(confirmText)) return;
    setBusy(action);
    setError(null);
    try {
      const r = await fetch("/api/lockout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: creds.b, token: creds.t, action }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Something went wrong.");
      setDone(j.summary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1.25rem" };
  const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
    display: "block",
    width: "100%",
    background: bg,
    color,
    border: bg === "#fff" ? "1.5px solid rgba(0,0,0,.2)" : 0,
    borderRadius: 12,
    padding: ".95rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    opacity: busy ? 0.6 : 1,
  });
  const muted: React.CSSProperties = { color: "#666", fontSize: ".92rem", lineHeight: 1.6, margin: 0 };

  return (
    <main style={{ minHeight: "70vh", background: "#F8F8F6", fontFamily: "'DM Sans', sans-serif", color: "#0F0F0F" }}>
      <section style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <p style={{ color: MINT, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".72rem", marginBottom: ".6rem" }}>Manhattan Mint · Lockout</p>

        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : !view ? (
          <div style={card}>
            <h1 style={{ fontSize: "1.4rem", margin: "0 0 .5rem" }}>Couldn&apos;t open that.</h1>
            <p style={muted}>{error}</p>
          </div>
        ) : done ? (
          <div style={{ ...card, borderColor: MINT }}>
            <h1 style={{ fontSize: "1.4rem", margin: "0 0 .5rem", color: DARK }}>Done.</h1>
            <p style={muted}>{done}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={card}>
              <h1 style={{ fontSize: "1.5rem", margin: "0 0 .3rem", lineHeight: 1.2 }}>🚪 {view.customerName}</h1>
              <p style={{ ...muted, marginBottom: ".6rem" }}>
                {view.address}
                <br />
                {view.dateLabel} · {view.cleanerName} · ${view.price}
              </p>
              {view.phone && (
                <p style={{ ...muted, marginBottom: ".4rem" }}>
                  <a href={`tel:${view.phone}`} style={{ color: DARK, fontWeight: 600 }}>Call {view.firstName}</a>
                  {" · "}
                  <a href={`sms:${view.phone}`} style={{ color: DARK, fontWeight: 600 }}>Text</a>
                </p>
              )}
              {!view.migrated ? (
                <p style={{ ...muted, color: "#b45309" }}>The lockout columns aren&apos;t in the database yet. Run lib/supabase/migrations/2026-10-28-lockout.sql.</p>
              ) : view.open ? (
                <p style={{ ...muted, color: "#b91c1c", fontWeight: 600 }}>
                  Timer started {view.lockedOutLabel}
                  {elapsed != null ? ` · ${elapsed} min ago` : ""}
                  {elapsed != null && elapsed >= 10 ? " · 10 minutes are up" : ""}
                </p>
              ) : view.resolvedLabel ? (
                <p style={{ ...muted, color: DARK, fontWeight: 600 }}>
                  Resolved {view.resolvedLabel}:{" "}
                  {view.resolution === "let_in" ? "customer let the cleaner in" : view.resolution === "charged" ? `$${(view.feeCents ?? 0) / 100} fee charged` : "fee waived"}
                </p>
              ) : (
                <p style={{ ...muted, color: "#b45309" }}>This job isn&apos;t marked as a lockout.</p>
              )}
            </div>

            {view.open && (
              <>
                <button type="button" style={btn(MINT)} disabled={!!busy} onClick={() => act("let_in", `${view.firstName} let ${view.cleanerName} in? The job carries on as normal.`)}>
                  {busy === "let_in" ? "Saving…" : "Customer let her in"}
                </button>
                <button
                  type="button"
                  style={btn("#b91c1c")}
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "charge",
                      `Release ${view.cleanerName} and charge ${view.firstName} the $${view.fee} lockout fee${view.taxable ? " + NY sales tax" : ""}?` +
                        (view.hold?.amount ? ` $${view.fee} is captured from the $${view.hold.amount} hold and the rest is released.` : view.hasCard ? " Charged to the card on file." : " NO CARD ON FILE — you'll have to collect it by hand.") +
                        ` ${view.firstName} gets a text${view.email ? " and an email" : ""}; ${view.cleanerName} is told to head home and keeps her pay.`,
                    )
                  }
                >
                  {busy === "charge" ? "Charging…" : `Release cleaner + charge $${view.fee}`}
                </button>
                <button
                  type="button"
                  style={btn("#fff", "#0F0F0F")}
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "waive",
                      `Release ${view.cleanerName} and WAIVE the fee?${view.hold?.amount ? ` The $${view.hold.amount} hold is released.` : ""} ${view.firstName} gets a no-fee text; ${view.cleanerName} is told to head home and keeps her pay.`,
                    )
                  }
                >
                  {busy === "waive" ? "Releasing…" : "Release cleaner, waive fee"}
                </button>
                <p style={{ ...muted, fontSize: ".82rem" }}>
                  The $119 fee is the lock-out line in the site terms. Whatever you pick, {view.cleanerName}&apos;s pay on this job stays as dispatched.
                </p>
              </>
            )}
            {error && <p style={{ ...muted, color: "#b91c1c" }}>{error}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
