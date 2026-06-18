"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function EmailCaptureSection() {
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (localStorage.getItem("mm_subscribed")) setAlreadySubscribed(true);
  }, []);

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
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <style>{`
        .ec-wrap{background:#1A1A1A;padding:5rem 4rem;}
        .ec-inner{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;max-width:1040px;margin:0 auto;}
        .ec-badge{display:inline-flex;align-items:center;gap:.4rem;background:rgba(29,158,117,.15);border:.5px solid rgba(29,158,117,.35);border-radius:2px;padding:.3rem .75rem;margin-bottom:1.35rem;}
        .ec-badge-dot{width:6px;height:6px;background:#1D9E75;border-radius:50%;}
        .ec-badge-txt{color:#1D9E75;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;}
        .ec-h2{font-family:'DM Serif Display',serif;font-size:clamp(2.2rem,3.5vw,3.2rem);color:#fff;font-weight:400;line-height:1.08;letter-spacing:-.025em;margin-bottom:.9rem;}
        .ec-h2 em{color:#1D9E75;font-style:italic;}
        .ec-sub{color:rgba(255,255,255,.38);font-size:.9rem;line-height:1.72;font-weight:300;max-width:380px;}
        .ec-stat{display:flex;align-items:center;gap:.6rem;margin-top:2rem;}
        .ec-stat-dot{width:8px;height:8px;background:#1D9E75;border-radius:50%;flex-shrink:0;}
        .ec-stat-txt{color:rgba(255,255,255,.35);font-size:.72rem;letter-spacing:.04em;}
        .ec-form{display:flex;flex-direction:column;gap:.65rem;}
        .ec-row{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;}
        .ec-input{padding:.8rem 1rem;background:rgba(255,255,255,.07);border:.5px solid rgba(255,255,255,.12);border-radius:2px;color:#fff;font-size:.82rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;width:100%;}
        .ec-input:focus{border-color:#1D9E75;}
        .ec-input::placeholder{color:rgba(255,255,255,.28);}
        .ec-btn{padding:.88rem;background:#1D9E75;border:none;border-radius:2px;color:#fff;font-size:.85rem;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:background .2s;width:100%;}
        .ec-btn:hover{background:#085041;}
        .ec-btn:disabled{opacity:.6;cursor:not-allowed;}
        .ec-fine{color:rgba(255,255,255,.18);font-size:.62rem;line-height:1.55;margin-top:.75rem;}
        .ec-success{padding:2rem;background:rgba(29,158,117,.08);border:.5px solid rgba(29,158,117,.25);border-radius:4px;text-align:center;}
        .ec-success-icon{font-size:1.5rem;color:#1D9E75;margin-bottom:.75rem;}
        .ec-success-h{font-family:'DM Serif Display',serif;font-size:1.5rem;color:#fff;font-weight:400;margin-bottom:.5rem;}
        .ec-success-s{color:rgba(255,255,255,.38);font-size:.82rem;line-height:1.6;}
        .ec-error{color:#ff6b6b;font-size:.75rem;text-align:center;margin-top:.25rem;}
        @media(max-width:768px){
          .ec-wrap{padding:4rem 1.5rem;}
          .ec-inner{grid-template-columns:1fr;gap:2.5rem;}
          .ec-sub{max-width:100%;}
          .ec-row{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="ec-wrap">
        <div className="ec-inner">

          {/* Left — copy */}
          <div>
            <div className="ec-badge">
              <div className="ec-badge-dot" />
              <span className="ec-badge-txt">Limited offer</span>
            </div>
            <h2 className="ec-h2">
              First-time visitors<br />get <em>$25 off.</em>
            </h2>
            <p className="ec-sub">
              Join thousands of Manhattan renters on our list. Be first to hear about open spots, seasonal deals, and apartment cleaning tips for NYC buildings.
            </p>
            <div className="ec-stat">
              <div className="ec-stat-dot" />
              <span className="ec-stat-txt">No spam. Unsubscribe any time.</span>
            </div>
          </div>

          {/* Right — form */}
          <div>
            {alreadySubscribed || status === "success" ? (
              <div className="ec-success">
                <div className="ec-success-icon">✓</div>
                <div className="ec-success-h">You&apos;re on the list.</div>
                <div className="ec-success-s">
                  {alreadySubscribed && status !== "success"
                    ? "You're already subscribed. Your discount code was sent to your inbox."
                    : "Your $25 discount code is on its way to your inbox."}
                </div>
              </div>
            ) : (
              <form className="ec-form" onSubmit={submit}>
                <div className="ec-row">
                  <input
                    className="ec-input"
                    type="text"
                    placeholder="First name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="ec-input"
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button className="ec-btn" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "Saving..." : "Get my $25 off →"}
                </button>
                {status === "error" && (
                  <div className="ec-error">
                    Something went wrong. Try again or email hello@manhattanmintnyc.com
                  </div>
                )}
                <div className="ec-fine">
                  By subscribing you agree to receive occasional emails from Manhattan Mint NYC LLC. Unsubscribe any time.
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
