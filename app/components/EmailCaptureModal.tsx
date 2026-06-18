"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function EmailCaptureModal() {
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (localStorage.getItem("mm_subscribed")) return;

    const dismissed = localStorage.getItem("mm_modal_dismissed");
    if (dismissed) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissed, 10) < sevenDays) return;
    }

    const timer = setTimeout(() => {
      setRendered(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem("mm_modal_dismissed", Date.now().toString());
    setVisible(false);
    setTimeout(() => setRendered(false), 450);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      localStorage.setItem("mm_subscribed", "1");
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setRendered(false), 450);
      }, 3500);
    } catch {
      setStatus("error");
    }
  };

  if (!rendered) return null;

  const s = {
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s ease",
      cursor: "pointer",
    },
    modal: {
      position: "fixed" as const,
      bottom: visible ? 0 : "-110%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1001,
      background: "#1A1A1A",
      borderRadius: "16px 16px 0 0",
      padding: "2.5rem 2rem 3rem",
      width: "100%",
      maxWidth: "480px",
      transition: "bottom 0.45s cubic-bezier(0.32,0.72,0,1)",
      fontFamily: "'DM Sans',sans-serif",
    },
    dismiss: {
      position: "absolute" as const,
      top: "1.25rem",
      right: "1.25rem",
      background: "rgba(255,255,255,0.07)",
      border: "none",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "rgba(255,255,255,0.4)",
      fontSize: "0.9rem",
      lineHeight: 1,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      background: "rgba(29,158,117,0.15)",
      border: "0.5px solid rgba(29,158,117,0.35)",
      borderRadius: "2px",
      padding: "0.3rem 0.75rem",
      marginBottom: "1.35rem",
    },
    badgeDot: {
      width: "6px",
      height: "6px",
      background: "#1D9E75",
      borderRadius: "50%",
    },
    badgeTxt: {
      color: "#1D9E75",
      fontSize: "0.62rem",
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      fontWeight: 500,
    },
    headline: {
      fontFamily: "'DM Serif Display',serif",
      fontSize: "clamp(1.9rem,6vw,2.5rem)",
      color: "#fff",
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      marginBottom: "0.85rem",
    },
    sub: {
      color: "rgba(255,255,255,0.4)",
      fontSize: "0.83rem",
      lineHeight: 1.65,
      fontWeight: 300,
      marginBottom: "1.75rem",
    },
    input: {
      padding: "0.78rem 1rem",
      background: "rgba(255,255,255,0.07)",
      border: "0.5px solid rgba(255,255,255,0.12)",
      borderRadius: "2px",
      color: "#fff",
      fontSize: "0.82rem",
      fontFamily: "'DM Sans',sans-serif",
      outline: "none",
      width: "100%",
    },
    btn: {
      padding: "0.88rem",
      background: status === "loading" ? "#0a6648" : "#1D9E75",
      border: "none",
      borderRadius: "2px",
      color: "#fff",
      fontSize: "0.85rem",
      fontWeight: 500,
      fontFamily: "'DM Sans',sans-serif",
      cursor: status === "loading" ? "not-allowed" : "pointer",
      transition: "background 0.2s",
      width: "100%",
      marginTop: "0.25rem",
    },
    fine: {
      color: "rgba(255,255,255,0.18)",
      fontSize: "0.62rem",
      lineHeight: 1.55,
      marginTop: "1rem",
      textAlign: "center" as const,
    },
  };

  return (
    <>
      <div style={s.overlay} onClick={dismiss} />
      <div style={s.modal}>
        <button style={s.dismiss} onClick={dismiss} aria-label="Close">✕</button>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "2rem", color: "#1D9E75", marginBottom: "1rem" }}>✓</div>
            <div style={{ ...s.badgeTxt, display: "block", marginBottom: "1rem" }}>You&apos;re in</div>
            <div style={s.headline}>Check your inbox.</div>
            <div style={s.sub}>Your $25 discount code is on its way.</div>
          </div>
        ) : (
          <>
            <div style={s.badge}>
              <div style={s.badgeDot} />
              <span style={s.badgeTxt}>Welcome offer</span>
            </div>

            <div style={s.headline}>
              Your first clean,<br />
              <em style={{ color: "#1D9E75", fontStyle: "italic" }}>$25 off.</em>
            </div>

            <div style={s.sub}>
              Drop your email and we&apos;ll send your code straight to your inbox. No spam — just promotions and tips for a cleaner apartment.
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <input
                type="text"
                placeholder="First name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={s.input}
              />
              <input
                type="email"
                placeholder="Your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={s.input}
              />
              <button type="submit" disabled={status === "loading"} style={s.btn}>
                {status === "loading" ? "Saving..." : "Claim my $25 off →"}
              </button>
            </form>

            {status === "error" && (
              <div style={{ color: "#ff6b6b", fontSize: "0.75rem", marginTop: "0.75rem", textAlign: "center" }}>
                Something went wrong. Try again or email us at hello@manhattanmintnyc.com
              </div>
            )}

            <div style={s.fine}>
              By subscribing you agree to receive occasional emails from Manhattan Mint NYC LLC. Unsubscribe any time.
            </div>
          </>
        )}
      </div>
    </>
  );
}
