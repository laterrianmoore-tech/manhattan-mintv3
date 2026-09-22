"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

// Seasonal promo: while active, the popup leads with the fall offer and shows
// the code outright (fewer steps = more bookings). After the end date it falls
// back to the evergreen $25 welcome-offer email capture, no redeploy needed.
// Keep these two values in sync with FALL50 in app/quote/page.tsx and
// app/api/bookings/submit/route.ts.
const FALL_PROMO_END = "2026-10-31";
const FALL_CODE = "FALL50";
const FALL_AMOUNT = 50;

function fallPromoActive() {
  return new Date().toISOString().slice(0, 10) <= FALL_PROMO_END;
}

export default function EmailCaptureModal() {
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const promo = fallPromoActive();
  const daysLeft = Math.max(0, Math.ceil((new Date(`${FALL_PROMO_END}T23:59:59`).getTime() - Date.now()) / 86400000));

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(FALL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is visible anyway */
    }
  };

  useEffect(() => {
    if (localStorage.getItem("mm_subscribed")) return;

    // A dismissal hides the popup for 7 days. The fall promo uses its own key
    // so people who dismissed the old welcome popup still see it once.
    const dismissKey = promo ? "mm_modal_dismissed_fall" : "mm_modal_dismissed";
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissed, 10) < sevenDays) return;
    }

    const timer = setTimeout(() => {
      setRendered(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [promo]);

  const dismiss = () => {
    localStorage.setItem(promo ? "mm_modal_dismissed_fall" : "mm_modal_dismissed", Date.now().toString());
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
      background: promo ? "radial-gradient(120% 90% at 100% 0%, #3a2413 0%, #1c1512 45%, #121110 100%)" : "#1A1A1A",
      borderRadius: "16px 16px 0 0",
      padding: promo ? "2.6rem 2rem 2.4rem" : "2.5rem 2rem 3rem",
      overflow: "hidden",
      width: "100%",
      maxWidth: "480px",
      transition: "bottom 0.45s cubic-bezier(0.32,0.72,0,1)",
      fontFamily: "'DM Sans',sans-serif",
    },
    dismiss: {
      position: "absolute" as const,
      zIndex: 2,
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
      background: promo ? "rgba(214,133,52,0.16)" : "rgba(29,158,117,0.15)",
      border: promo ? "0.5px solid rgba(214,133,52,0.4)" : "0.5px solid rgba(29,158,117,0.35)",
      borderRadius: "2px",
      padding: "0.3rem 0.75rem",
      marginBottom: "1.35rem",
    },
    badgeDot: {
      width: "6px",
      height: "6px",
      background: promo ? "#D68534" : "#1D9E75",
      borderRadius: "50%",
    },
    badgeTxt: {
      color: promo ? "#E9A35C" : "#1D9E75",
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
      color: "rgba(255,255,255,0.45)",
      fontSize: "0.83rem",
      lineHeight: 1.65,
      fontWeight: 300,
      marginBottom: "1.5rem",
    },
    codeBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      background: "rgba(255,255,255,0.06)",
      border: "1px dashed rgba(255,255,255,0.25)",
      borderRadius: "6px",
      padding: "0.85rem 1rem",
      marginBottom: "0.9rem",
    },
    codeLabel: {
      color: "rgba(255,255,255,0.45)",
      fontSize: "0.68rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
    },
    code: {
      color: "#fff",
      fontSize: "1.35rem",
      letterSpacing: "0.12em",
      fontWeight: 500,
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
      textDecoration: "none",
      display: "block",
      textAlign: "center" as const,
    },
    link: {
      background: "none",
      border: "none",
      color: "rgba(255,255,255,0.5)",
      fontSize: "0.78rem",
      textDecoration: "underline",
      cursor: "pointer",
      fontFamily: "'DM Sans',sans-serif",
      padding: 0,
      marginTop: "0.9rem",
    },
    fine: {
      color: "rgba(255,255,255,0.18)",
      fontSize: "0.62rem",
      lineHeight: 1.55,
      marginTop: "1rem",
      textAlign: "center" as const,
    },
  };

  const emailForm = (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <input type="text" placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={s.input} />
      <input type="email" placeholder="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} />
      <button type="submit" disabled={status === "loading"} style={s.btn}>
        {status === "loading" ? "Saving..." : promo ? `Email me the $${FALL_AMOUNT} code →` : "Claim my $25 off →"}
      </button>
    </form>
  );

  return (
    <>
      <style>{`
        .fp{position:relative;font-family:'DM Sans',sans-serif;}
        .fp-leaf{position:absolute;right:-46px;top:-78px;width:132px;height:132px;opacity:.55;transform:rotate(18deg);pointer-events:none;z-index:0;}
        .fp > *:not(.fp-leaf){position:relative;z-index:1;}
        .fp-title{padding-right:.5rem;}
        .fp-kicker{display:inline-flex;align-items:center;gap:.5rem;color:#f0a24a;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;font-weight:500;margin-bottom:1.1rem;}
        .fp-kicker-dot{width:7px;height:7px;border-radius:50%;background:#f0a24a;box-shadow:0 0 0 4px rgba(240,162,74,.18);animation:fpPulse 1.8s ease-in-out infinite;}
        @keyframes fpPulse{0%,100%{box-shadow:0 0 0 3px rgba(240,162,74,.18)}50%{box-shadow:0 0 0 7px rgba(240,162,74,.06)}}
        .fp-title{font-family:'DM Serif Display',serif;font-weight:400;color:#fff;font-size:clamp(1.85rem,6vw,2.45rem);line-height:1.08;letter-spacing:-.02em;margin:0 0 .85rem;}
        .fp-title em{font-style:italic;color:#f0a24a;}
        .fp-sub{color:rgba(255,255,255,.62);font-size:.86rem;line-height:1.65;font-weight:300;margin:0 0 1.35rem;max-width:34ch;}
        .fp-sub strong{color:#fff;font-weight:500;}
        .fp-ticket{width:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto;align-items:center;gap:0 1rem;text-align:left;background:rgba(255,255,255,.05);border:1px dashed rgba(240,162,74,.55);border-radius:10px;padding:.8rem 1rem;cursor:pointer;font-family:inherit;color:#fff;transition:background .2s,border-color .2s;}
        .fp-ticket:hover{background:rgba(240,162,74,.08);border-color:#f0a24a;}
        .fp-ticket-label{grid-column:1;color:rgba(255,255,255,.5);font-size:.64rem;letter-spacing:.14em;text-transform:uppercase;}
        .fp-ticket-code{grid-column:1;font-size:1.55rem;letter-spacing:.16em;font-weight:500;line-height:1.1;}
        .fp-ticket-copy{grid-column:2;grid-row:1/3;color:#f0a24a;font-size:.72rem;white-space:nowrap;}
        .fp-cta{display:flex;align-items:center;justify-content:center;gap:.6rem;width:100%;margin-top:.7rem;padding:.95rem 1rem;background:linear-gradient(180deg,#f0a24a,#d97f2b);color:#1a1208;border-radius:10px;font-weight:600;font-size:.92rem;text-decoration:none;box-shadow:0 8px 24px rgba(240,162,74,.28);transition:transform .15s,box-shadow .15s;}
        .fp-cta:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(240,162,74,.36);}
        .fp-link{display:block;margin:.85rem auto 0;background:none;border:none;color:rgba(255,255,255,.5);font-size:.78rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer;font-family:inherit;padding:0;}
        .fp-link:hover{color:rgba(255,255,255,.8);}
        .fp-fine{color:rgba(255,255,255,.28);font-size:.64rem;line-height:1.6;margin:1rem 0 0;text-align:center;}
        @media (min-width:640px){
          .mm-modal-promo{bottom:auto !important;top:50% !important;transform:translate(-50%,-50%) !important;border-radius:18px !important;max-width:500px !important;padding:2.8rem 2.4rem 2.5rem !important;}
        }
      `}</style>
      <div style={s.overlay} onClick={dismiss} />
      <div style={s.modal} className={promo ? "mm-modal-promo" : undefined}>
        <button style={s.dismiss} onClick={dismiss} aria-label="Close">✕</button>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "2rem", color: "#1D9E75", marginBottom: "1rem" }}>✓</div>
            <div style={{ ...s.badgeTxt, display: "block", marginBottom: "1rem" }}>You&apos;re in</div>
            <div style={s.headline}>Check your inbox.</div>
            <div style={s.sub}>Your ${promo ? FALL_AMOUNT : 25} discount code is on its way.</div>
          </div>
        ) : promo ? (
          <div className="fp">
            <svg className="fp-leaf" viewBox="0 0 120 120" aria-hidden="true">
              <path d="M96 14C60 18 30 40 22 78c-2 9-2 18 0 28 10 2 19 2 28 0 38-8 60-38 64-74 1-6 1-12-2-18h-8z" fill="url(#fpg)" />
              <path d="M24 104C44 76 66 54 96 22" stroke="rgba(255,255,255,.22)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <defs><linearGradient id="fpg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#b8541c" /><stop offset="1" stopColor="#f0a24a" /></linearGradient></defs>
            </svg>

            <div className="fp-kicker">
              <span className="fp-kicker-dot" />
              Fall in Manhattan · {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </div>

            <h2 className="fp-title">
              Heat&apos;s on. Windows shut.<br />
              <em>Time for a reset.</em>
            </h2>

            <p className="fp-sub">
              Take <strong>${FALL_AMOUNT} off your first clean</strong> this fall. Same background-checked cleaner every visit
              if you go recurring, photo summary when we&apos;re done. Ends October 31.
            </p>

            {!showEmailForm ? (
              <>
                <button type="button" className="fp-ticket" onClick={copyCode} aria-label="Copy code FALL50">
                  <span className="fp-ticket-label">Your code</span>
                  <span className="fp-ticket-code">{FALL_CODE}</span>
                  <span className="fp-ticket-copy">{copied ? "Copied ✓" : "Tap to copy"}</span>
                </button>
                <a href={`/quote/?code=${FALL_CODE}`} className="fp-cta">
                  Book my fall clean
                  <span aria-hidden="true">→</span>
                </a>
                <button type="button" className="fp-link" onClick={() => setShowEmailForm(true)}>
                  Not ready today? Email me the code
                </button>
              </>
            ) : (
              emailForm
            )}

            {status === "error" && (
              <div style={{ color: "#ff8f7a", fontSize: "0.75rem", marginTop: "0.75rem", textAlign: "center" }}>
                Something went wrong. Try again or email us at hello@manhattanmintnyc.com
              </div>
            )}

            <p className="fp-fine">
              First clean only · Manhattan apartments · book by Oct 31, 2026
              {showEmailForm ? " · By subscribing you agree to occasional emails from Manhattan Mint NYC LLC. Unsubscribe any time." : ""}
            </p>
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

            {emailForm}

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
