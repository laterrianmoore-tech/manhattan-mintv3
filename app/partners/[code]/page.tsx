"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Broker partner tracking page (2026-10-30). One private page per referring
// broker, no login: the signed link /partners/<CODE>/?t=<token> is the key.
// Clicks on their link, bookings, completed cleans, recurring conversions and
// fees earned / paid / owed, plus the job list. Never shows what the client
// paid, only the broker's fee per job.

type Job = {
  id: string;
  date: string;
  client: string;
  apartment: string;
  status: "booked" | "in_progress" | "completed" | "awaiting_payment" | "lockout";
  statusLabel: string;
  recurring: boolean;
  fee: number;
  firstClean: boolean;
  recurringBonus: boolean;
  paidAt: string | null;
};
type Stats = {
  code: string;
  name: string;
  contactName: string | null;
  feePerJob: number;
  feeRecurring: number;
  clicks: number;
  bookings: number;
  completed: number;
  newClients: number;
  recurringConversions: number;
  feesEarned: number;
  feesPaid: number;
  feesOwed: number;
  dbReady: boolean;
  jobs: Job[];
};

const MINT = "var(--mint, #1D9E75)";
const MINT_DARK = "var(--mint-dark, #157a5a)";

function fmtDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PartnerPage() {
  const params = useParams<{ code: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<Stats> => {
      const code = String(params?.code ?? "").trim().toUpperCase();
      const t = (new URLSearchParams(window.location.search).get("t") || "").trim();
      if (!code || !t) throw new Error("This link is missing its key. Open it from the message we sent you, or text (914) 863-7902 for a fresh one.");
      const j = await fetch(`/api/partners/?code=${encodeURIComponent(code)}&t=${encodeURIComponent(t)}`).then((r) => r.json());
      if (!j.ok) throw new Error(j.error || "Couldn't load this page.");
      return j.stats as Stats;
    };
    load()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params]);

  const card: React.CSSProperties = { background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "1.25rem" };
  const h2: React.CSSProperties = { fontSize: "1.05rem", margin: "0 0 .75rem" };
  const muted: React.CSSProperties = { color: "#666", fontSize: ".9rem", lineHeight: 1.6, margin: 0 };
  const statCell: React.CSSProperties = { ...card, padding: "1rem 1.1rem" };
  const statNum: React.CSSProperties = { fontFamily: "'DM Serif Display', serif", fontSize: "1.9rem", lineHeight: 1.1, margin: 0 };
  const statLabel: React.CSSProperties = { color: "#666", fontSize: ".78rem", letterSpacing: ".04em", textTransform: "uppercase", margin: "0 0 .35rem" };

  const statusColor = (s: Job["status"]) => (s === "completed" ? MINT_DARK : s === "awaiting_payment" ? "#b45309" : s === "lockout" ? "#999" : "#444");

  return (
    <main style={{ minHeight: "70vh", background: "var(--soft, #F8F8F6)", fontFamily: "'DM Sans', sans-serif", color: "#0F0F0F" }}>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>
        <p style={{ color: MINT, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".72rem", marginBottom: ".6rem" }}>Manhattan Mint · Partner referrals</p>

        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : !stats ? (
          <div style={card}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "1.8rem", margin: "0 0 .6rem" }}>We couldn&apos;t open that.</h1>
            <p style={{ color: "#444", lineHeight: 1.6, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.5rem)", margin: "0 0 .4rem", lineHeight: 1.1 }}>{stats.name}</h1>
            <p style={{ ...muted, marginBottom: "1.25rem" }}>
              Your code is <strong style={{ color: MINT_DARK, letterSpacing: ".04em" }}>{stats.code}</strong>. ${stats.feePerJob} for each new client you send, paid once their first clean is done, plus a one-time ${stats.feeRecurring} bonus when that client completes their first visit on a weekly or bi-weekly plan. Each fee is paid once per client. Paid every Friday for the prior week.
            </p>

            {!stats.dbReady && (
              <div style={{ ...card, borderColor: "#f3c87a", background: "#fff8e8", marginBottom: "1rem" }}>
                <p style={{ margin: 0, color: "#8a5a00", fontSize: ".9rem", lineHeight: 1.6 }}>Tracking is being switched on. Bookings made through your link are being recorded and will show here shortly.</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: ".75rem", marginBottom: "1rem" }}>
              <div style={statCell}><p style={statLabel}>Link clicks</p><p style={statNum}>{stats.clicks}</p></div>
              <div style={statCell}><p style={statLabel}>Bookings</p><p style={statNum}>{stats.bookings}</p></div>
              <div style={statCell}><p style={statLabel}>Clients cleaned</p><p style={statNum}>{stats.newClients}</p></div>
              <div style={statCell}><p style={statLabel}>Recurring clients</p><p style={statNum}>{stats.recurringConversions}</p></div>
            </div>

            <div style={{ ...card, marginBottom: "1rem", background: "#f3faf7", borderColor: "rgba(29,158,117,.25)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: ".75rem" }}>
                <div><p style={statLabel}>Fees earned</p><p style={{ ...statNum, color: MINT_DARK }}>${stats.feesEarned}</p></div>
                <div><p style={statLabel}>Paid to you</p><p style={statNum}>${stats.feesPaid}</p></div>
                <div><p style={statLabel}>Owed, next Friday</p><p style={statNum}>${stats.feesOwed}</p></div>
              </div>
            </div>

            <div style={card}>
              <h2 style={h2}>Jobs from your referrals</h2>
              {stats.jobs.length === 0 ? (
                <p style={muted}>Nothing yet. Share your link and the first booking shows up here the moment it&apos;s made.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
                    <thead>
                      <tr style={{ color: "#666", fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".04em", textAlign: "left" }}>
                        <th style={{ padding: ".4rem 0", fontWeight: 500 }}>Date</th>
                        <th style={{ padding: ".4rem .5rem", fontWeight: 500 }}>Client</th>
                        <th style={{ padding: ".4rem .5rem", fontWeight: 500 }}>Apartment</th>
                        <th style={{ padding: ".4rem .5rem", fontWeight: 500 }}>Status</th>
                        <th style={{ padding: ".4rem 0", fontWeight: 500, textAlign: "right" }}>Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.jobs.map((j) => (
                        <tr key={j.id} style={{ borderTop: "1px solid rgba(0,0,0,.06)" }}>
                          <td style={{ padding: ".55rem 0", whiteSpace: "nowrap" }}>{fmtDate(j.date)}</td>
                          <td style={{ padding: ".55rem .5rem", whiteSpace: "nowrap" }}>{j.client}</td>
                          <td style={{ padding: ".55rem .5rem", color: "#666" }}>
                            {j.apartment}
                            {j.recurring ? <span style={{ color: MINT_DARK, fontSize: ".78rem" }}> · recurring</span> : null}
                          </td>
                          <td style={{ padding: ".55rem .5rem", color: statusColor(j.status), whiteSpace: "nowrap" }}>{j.statusLabel}</td>
                          <td style={{ padding: ".55rem 0", textAlign: "right", whiteSpace: "nowrap" }}>
                            {j.fee ? (
                              <>
                                <strong>${j.fee}</strong>
                                <span style={{ display: "block", color: "#666", fontSize: ".75rem" }}>
                                  {j.firstClean && j.recurringBonus ? "first clean + recurring · " : j.recurringBonus ? "recurring bonus · " : "first clean · "}
                                  {j.paidAt ? `paid ${fmtDate(j.paidAt.slice(0, 10))}` : "owed"}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: "#999" }} title={j.status === "completed" ? "Fees for this client were already earned on an earlier visit" : undefined}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p style={{ ...muted, textAlign: "center", marginTop: "1.25rem" }}>
              Your link: <span style={{ color: MINT_DARK, fontWeight: 500 }}>manhattanmintnyc.com/quote/?code={stats.code}</span>
              <br />
              Questions? Text <a href="sms:+19148637902" style={{ color: MINT_DARK, fontWeight: 500 }}>(914) 863-7902</a>.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
