"use client";

import { useEffect, useState } from "react";

// Customer account (2026-10-09). One page, no login: the signed link in the
// customer's texts opens it. Upcoming visits with move/skip, past cleans,
// card on file, friend code, and a text-us line. Reached at
// /account/?c=<customer>&t=<token>.

type Visit = { id: string; date: string; dateLabel: string; summary: string | null; window: string; price: number; cleaner: string | null; status: string; manageUrl: string };
type Past = { id: string; date: string; dateLabel: string; summary: string | null; price: number; cleaner: string | null };
type Account = {
  firstName: string;
  address: string;
  plan: string | null;
  upcoming: Visit[];
  past: Past[];
  card: { onFile: boolean; label: string | null; setupUrl: string | null };
  friendCode: string;
  friendLink: string;
  friendDiscount: number;
  referrerCredit: number;
  bookUrl: string;
};

const MINT = "var(--mint, #1D9E75)";
const MINT_DARK = "var(--mint-dark, #157a5a)";

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardSaved, setCardSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = (sp.get("c") || "").trim();
    const t = (sp.get("t") || "").trim();
    setCardSaved(sp.get("card") === "saved");
    if (!c || !t) {
      setError("This link is missing its key. Open it from one of our texts, or text (914) 863-7902 and we'll send a fresh one.");
      setLoading(false);
      return;
    }
    fetch(`/api/account/?c=${encodeURIComponent(c)}&t=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error(j.error || "Couldn't load your account.");
        setAccount(j.account);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1.25rem" };
  const h2: React.CSSProperties = { fontSize: "1.05rem", margin: "0 0 .75rem" };
  const btn: React.CSSProperties = { display: "inline-block", background: MINT, color: "#fff", border: 0, borderRadius: 10, padding: ".7rem 1.1rem", fontSize: ".95rem", fontWeight: 500, fontFamily: "inherit", textDecoration: "none" };
  const btnGhost: React.CSSProperties = { ...btn, background: "#fff", color: "#0F0F0F", border: "1px solid rgba(0,0,0,.2)" };
  const muted: React.CSSProperties = { color: "#666", fontSize: ".9rem", lineHeight: 1.6, margin: 0 };

  return (
    <main style={{ minHeight: "70vh", background: "var(--soft, #F8F8F6)", fontFamily: "'DM Sans', sans-serif", color: "#0F0F0F" }}>
      <section style={{ maxWidth: 620, margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>
        <p style={{ color: MINT, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".72rem", marginBottom: ".6rem" }}>Your account</p>

        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : !account ? (
          <div style={card}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "1.8rem", margin: "0 0 .6rem" }}>We couldn&apos;t open that.</h1>
            <p style={{ color: "#444", lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.5rem)", margin: "0 0 .4rem", lineHeight: 1.1 }}>
              Hi {account.firstName}.
            </h1>
            <p style={{ ...muted, marginBottom: "1.25rem" }}>
              {account.address}
              {account.plan ? ` · ${account.plan} plan` : ""}
            </p>

            {cardSaved && (
              <div style={{ ...card, borderColor: MINT, marginBottom: "1rem" }}>
                <p style={{ margin: 0, color: MINT_DARK, fontWeight: 500 }}>Card saved. Future cleans are charged automatically after each visit.</p>
              </div>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Upcoming */}
              <div style={card}>
                <h2 style={h2}>Upcoming</h2>
                {account.upcoming.length === 0 ? (
                  <>
                    <p style={{ ...muted, marginBottom: ".85rem" }}>Nothing on the calendar yet.</p>
                    <a href={account.bookUrl} style={btn}>Book a clean</a>
                  </>
                ) : (
                  <div style={{ display: "grid", gap: ".85rem" }}>
                    {account.upcoming.map((v) => (
                      <div key={v.id} style={{ borderTop: "1px solid rgba(0,0,0,.06)", paddingTop: ".85rem" }}>
                        <div style={{ fontWeight: 600 }}>{v.dateLabel}</div>
                        <p style={muted}>
                          {v.window ? `${v.window}. ` : ""}
                          {v.summary ? `${v.summary}. ` : ""}
                          {v.cleaner ? `${v.cleaner} is your cleaner. ` : "Cleaner assigned the day before. "}
                          ${v.price}
                        </p>
                        <a href={v.manageUrl} style={{ color: MINT_DARK, fontWeight: 500, fontSize: ".9rem" }}>Move or skip this visit →</a>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(0,0,0,.06)", paddingTop: ".85rem" }}>
                      <a href={account.bookUrl} style={btnGhost}>Book another clean</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div style={card}>
                <h2 style={h2}>Payment</h2>
                {account.card.onFile ? (
                  <p style={muted}>{account.card.label ?? "Card on file"}. Charged automatically after each clean, never before. Text us to change it.</p>
                ) : account.card.setupUrl ? (
                  <>
                    <p style={{ ...muted, marginBottom: ".85rem" }}>No card on file yet. Save one once and every clean after that is hands-off, charged only after the visit.</p>
                    <a href={account.card.setupUrl} style={btn}>Save a card</a>
                  </>
                ) : (
                  <p style={muted}>We invoice you after each clean. Text us if you&apos;d like to keep a card on file instead.</p>
                )}
              </div>

              {/* Friend code */}
              <div style={card}>
                <h2 style={h2}>Your friend code</h2>
                <p style={{ ...muted, marginBottom: ".75rem" }}>
                  Anyone who books with <strong style={{ color: MINT_DARK, letterSpacing: ".04em" }}>{account.friendCode}</strong> gets ${account.friendDiscount} off their first clean, and you get ${account.referrerCredit} off your next one once theirs is done. Same building, same day is our favorite.
                </p>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={btnGhost}
                    onClick={() => {
                      navigator.clipboard?.writeText(account.friendLink).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                  >
                    {copied ? "Copied" : "Copy my link"}
                  </button>
                  <a
                    href={`sms:?&body=${encodeURIComponent(`Try Manhattan Mint for your apartment — my code ${account.friendCode} gets you $${account.friendDiscount} off: ${account.friendLink}`)}`}
                    style={btnGhost}
                  >
                    Text it to a friend
                  </a>
                </div>
              </div>

              {/* Past cleans */}
              {account.past.length > 0 && (
                <div style={card}>
                  <h2 style={h2}>Past cleans</h2>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
                    <tbody>
                      {account.past.map((p) => (
                        <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,.06)" }}>
                          <td style={{ padding: ".5rem 0", whiteSpace: "nowrap" }}>{p.dateLabel}</td>
                          <td style={{ padding: ".5rem .5rem", color: "#666" }}>{p.summary ?? ""}{p.cleaner ? ` · ${p.cleaner}` : ""}</td>
                          <td style={{ padding: ".5rem 0", textAlign: "right", whiteSpace: "nowrap" }}>${p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p style={{ ...muted, textAlign: "center", marginTop: ".5rem" }}>
                Anything else? Text <a href="sms:+19148637902" style={{ color: MINT_DARK, fontWeight: 500 }}>(914) 863-7902</a> and a person answers.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
