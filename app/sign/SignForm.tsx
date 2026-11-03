"use client";

import { useState } from "react";

const GREEN = "#1e4d38";
const SANS = "'DM Sans',Helvetica,Arial,sans-serif";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "long", timeStyle: "short" }) + " ET";
}

export default function SignForm({
  cleanerId,
  token,
  defaultName,
  defaultAddress,
  signedAt,
  signedName,
}: {
  cleanerId: string;
  token: string;
  defaultName: string;
  defaultAddress: string;
  signedAt: string | null;
  signedName: string | null;
}) {
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState(defaultAddress);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ signedAt: string; emailed: boolean } | null>(signedAt ? { signedAt, emailed: true } : null);

  if (done) {
    return (
      <div style={{ marginTop: 28, background: "#eef5f0", border: `1px solid ${GREEN}33`, borderRadius: 12, padding: "18px 16px", fontFamily: SANS }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: GREEN }}>Signed ✓</p>
        <p style={{ margin: "6px 0 0", color: "#2d4a3b", lineHeight: 1.5 }}>
          Signed by {signedName || name} on {fmt(done.signedAt)}.{" "}
          {done.emailed ? "A signed PDF copy is on its way to your email." : "We'll email you the signed PDF copy shortly."}
        </p>
        <p style={{ margin: "10px 0 0", color: "#4a4a44", lineHeight: 1.5, fontSize: 14 }}>
          Next: finish your Stripe payout setup and the Certn background check from your onboarding email.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) { setError("Please confirm you have read and agree to the agreement."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/sign/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c: cleanerId, t: token, name, address, agree: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.alreadySignedAt) { setDone({ signedAt: json.alreadySignedAt, emailed: true }); return; }
      if (!res.ok || !json.ok) throw new Error(json.error || "Couldn't record the signature. Please try again.");
      setDone({ signedAt: json.signedAt, emailed: !!json.emailed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16, border: "1px solid #d9d4c7", borderRadius: 8, background: "#fff", fontFamily: SANS };

  return (
    <form onSubmit={submit} style={{ marginTop: 28, borderTop: "1px solid #e5e1d6", paddingTop: 22, fontFamily: SANS }}>
      <p style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: "#141414" }}>Sign the agreement</p>
      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#4a4a44", marginBottom: 6 }}>Full legal name (this is your signature)</span>
        <input style={{ ...input, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20 }} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      </label>
      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#4a4a44", marginBottom: 6 }}>Home address</span>
        <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state ZIP" autoComplete="street-address" />
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, fontSize: 15, lineHeight: 1.5, color: "#262622" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18 }} />
        <span>I have read the Independent Contractor Agreement above and agree to it. I understand that typing my name here is my electronic signature (Section 13.5).</span>
      </label>
      {error && <p style={{ color: "#b3261e", margin: "0 0 12px", fontSize: 14 }}>{error}</p>}
      <button
        type="submit"
        disabled={busy}
        style={{ width: "100%", padding: "14px 18px", fontSize: 16, fontWeight: 700, color: "#fff", background: GREEN, border: 0, borderRadius: 10, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}
      >
        {busy ? "Signing…" : "Sign agreement"}
      </button>
    </form>
  );
}
