"use client";

import { useState } from "react";

// Inline editor for what a booking will be charged. Auto-charge on
// "Job Complete" uses pricing_total, so edits must land before then —
// the API rejects completed/cancelled/already-charged jobs.
export default function PriceEditor({
  bookingId,
  initialTotal,
  onDone,
  onClose,
}: {
  bookingId: string;
  initialTotal: number;
  onDone: (message: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(initialTotal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const newTotal = Number(value);
    if (!Number.isInteger(newTotal) || newTotal < 0) {
      setError("Enter a whole dollar amount.");
      return;
    }
    if (newTotal === initialTotal) {
      onClose();
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings/update-price/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, newTotal }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      onDone(`Price updated: $${initialTotal} → $${newTotal}. The card will be charged $${newTotal} at Job Complete.`);
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Charge amount</span>
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
      <button
        onClick={handleSave}
        disabled={busy}
        className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
        style={{ backgroundColor: "#1d9e75" }}
      >
        {busy ? "Saving…" : "Save price"}
      </button>
      <button
        onClick={onClose}
        disabled={busy}
        className="px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700"
      >
        Back
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
