"use client";

import { useState } from "react";

// Send / Resend packet button plus copyable links (2026-11-03).
export default function OnboardingActions({
  cleanerId,
  name,
  sentAt,
  signLink,
  connectLink,
}: {
  cleanerId: string;
  name: string;
  sentAt: string | null;
  signLink: string;
  connectLink: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(!!sentAt);

  async function send() {
    if (!confirm(`${sent ? "Resend" : "Send"} the onboarding packet to ${name} by email and text?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cleaners/onboarding-packet/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const r = json.result;
      setSent(true);
      setMsg(`Sent. Email ${r.emailSent ? "✓" : "✗"}, text ${r.smsSent ? "✓" : `✗ ${r.smsError ?? ""}`}, Stripe ${r.connectAccountId}${r.connectCreated ? " (new)" : ""}, Certn ${r.certn.status.replace(/_/g, " ")}.`);
    } catch (e) {
      setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`${label} link copied.`);
    } catch {
      setMsg(text);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 md:w-44">
      <button
        onClick={send}
        disabled={busy}
        className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "#1e4d38" }}
      >
        {busy ? "Sending…" : sent ? "Resend packet" : "Send packet"}
      </button>
      <div className="flex gap-2 text-xs">
        <button onClick={() => copy("Sign", signLink)} className="flex-1 rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50">Copy sign link</button>
        {connectLink && (
          <button onClick={() => copy("Stripe", connectLink)} className="flex-1 rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50">Copy Stripe link</button>
        )}
      </div>
      {msg && <p className="text-xs text-gray-600 break-words">{msg}</p>}
    </div>
  );
}
