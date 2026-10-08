"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// One payout batch per cleaner: every owed job in the list, one reference,
// one click. The money moves in Stripe/Zelle first; this records it.
export default function MarkPaidForm({
  cleanerName,
  total,
  items,
}: {
  cleanerName: string;
  total: number;
  items: { bookingId: string; slot: "primary" | "second" }[];
}) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (
      !window.confirm(
        `Record $${total} as paid to ${cleanerName} across ${items.length} job${items.length === 1 ? "" : "s"}? Do this after the transfer has gone out.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/accounting/mark-paid/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, ref }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone(`Recorded: $${total} to ${cleanerName}${ref ? ` (${ref})` : ""}.`);
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
        placeholder="transfer ref (Stripe tr_…, Zelle 10/10)"
        className="flex-1 min-w-[200px] rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
        style={{ backgroundColor: "#1d9e75" }}
      >
        {busy ? "Saving…" : `Mark $${total} paid to ${cleanerName}`}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
