"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// After the Friday Zelle/Venmo to a broker: one click records every owed fee
// as paid. The money moves first; this only stamps it.
export default function BrokerPaidForm({ code, name, total, count }: { code: string; name: string; total: number; count: number }) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!window.confirm(`Record $${total} as paid to ${name} across ${count} job${count === 1 ? "" : "s"}? Do this after the Zelle/Venmo has gone out.`)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/partners/mark-paid/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, ref }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setDone(`Recorded: $${total} to ${name}${ref ? ` (${ref})` : ""}.`);
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  if (done) return <p className="text-xs text-green-700">{done}</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="ref (Zelle 11/6, Venmo 11/6)"
        className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
      />
      <button onClick={handleSubmit} disabled={busy} className="px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50" style={{ backgroundColor: "#1d9e75" }}>
        {busy ? "Saving…" : `Mark $${total} paid to ${name}`}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
