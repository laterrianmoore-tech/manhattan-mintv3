"use client";

import { useState } from "react";

// Inline editor for what the cleaner is paid on a job (2026-10-08). Dispatch
// fills this from the pay table; the owner uses this to override it. If the
// cleaner already has the job text, saving a different number texts them a
// one-line pay update.
export default function PayEditor({
  bookingId,
  initialAmount,
  suggested,
  slot = "primary",
  cleanerName,
  onDone,
  onClose,
}: {
  bookingId: string;
  initialAmount: number | null;
  /** Table estimate shown as a hint when nothing is set yet. */
  suggested?: number | null;
  slot?: "primary" | "second";
  cleanerName?: string | null;
  onDone: (message: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialAmount != null ? String(initialAmount) : suggested != null ? String(suggested) : "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const amount = Number(value);
    if (!Number.isInteger(amount) || amount < 0) {
      setError("Enter a whole dollar amount.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings/update-pay/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount, slot, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const who = cleanerName ?? (slot === "second" ? "2nd cleaner" : "cleaner");
      onDone(
        data.previous != null && data.previous !== amount
          ? `${who}'s pay: $${data.previous} → $${amount}.${data.cleanerTexted ? " They've been texted the update." : ""}`
          : `${who}'s pay set to $${amount}.${data.cleanerTexted ? " They've been texted." : ""}`,
      );
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">{slot === "second" ? "2nd cleaner pay" : "Cleaner pay"}</span>
      <div className="flex items-center rounded-lg border border-gray-300 bg-white px-2 py-1">
        <span className="text-xs text-gray-400 mr-1">$</span>
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 text-sm focus:outline-none"
          autoFocus
        />
      </div>
      {slot === "primary" && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="why (optional): neglected apt, agreed by text…"
          className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
        />
      )}
      <button
        onClick={handleSave}
        disabled={busy}
        className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
        style={{ backgroundColor: "#1d9e75" }}
      >
        {busy ? "Saving…" : "Save pay"}
      </button>
      <button
        onClick={onClose}
        disabled={busy}
        className="px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700"
      >
        Back
      </button>
      {suggested != null && initialAmount == null && (
        <p className="w-full text-[11px] text-gray-400">Table rate: ${suggested}. Dispatch uses it unless you save a number here.</p>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
