"use client";

import { useState } from "react";

const TIME_RANGES = ["Morning", "Midday", "Afternoon", "Evening"] as const;
const RANGE_HOURS: Record<string, string> = {
  Morning: "8–12",
  Midday: "10–2",
  Afternoon: "12–4",
  Evening: "4–7",
};

export default function ScheduleEditor({
  bookingId,
  initialDate,
  initialRanges,
  onDone,
  onClose,
}: {
  bookingId: string;
  initialDate: string;
  initialRanges: string[];
  onDone: (message: string) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [ranges, setRanges] = useState<string[]>(initialRanges);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleRange(r: string) {
    setRanges((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function handleSave() {
    if (!date) {
      setError("Pick a date.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings/reschedule/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, newDate: date, newTimeRanges: ranges }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      onDone(data.cleanerNotified ? "Schedule updated — cleaner texted." : "Schedule updated.");
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TIME_RANGES.map((r) => {
          const active = ranges.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggleRange(r)}
              className={`px-2.5 py-1 rounded-lg border text-xs ${
                active ? "text-white" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
              style={active ? { backgroundColor: "#1d9e75", borderColor: "#1d9e75" } : undefined}
              title={RANGE_HOURS[r]}
            >
              {r}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={busy || !date}
          className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: "#1d9e75" }}
        >
          {busy ? "Saving…" : "Save schedule"}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
