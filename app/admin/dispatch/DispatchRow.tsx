"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cleaner = {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
};

type Booking = {
  id: string;
  service_date: string;
  service_summary: string;
  bedrooms: number;
  preferred_time_ranges: string[] | null;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
    apt_no: string | null;
  };
};

export default function DispatchRow({
  booking,
  cleaners,
}: {
  booking: Booking;
  cleaners: Cleaner[];
}) {
  const router = useRouter();
  const [selectedCleaner, setSelectedCleaner] = useState("");
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [dispatchedName, setDispatchedName] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

  const dateStr = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : booking.preferred_time_ranges || "—";
  const aptSuffix = booking.customers.apt_no ? ` Apt ${booking.customers.apt_no}` : "";

  async function handleDispatch() {
    if (!selectedCleaner) {
      setError("Select a cleaner first.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/dispatch/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, cleanerId: selectedCleaner }),
    });

    if (res.ok) {
      const name = cleaners.find((c) => c.id === selectedCleaner);
      setDispatchedName(name ? `${name.first_name} ${name.last_name}` : "cleaner");
      setDispatched(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (
      !window.confirm(
        `Cancel ${booking.customers.first_name}'s ${dateStr} booking? Use this to clear duplicates and tests too.`
      )
    )
      return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings/cancel/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    if (res.ok) {
      setCancelled(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
        <span>✕</span>
        <span>
          Canceled{" "}
          <strong>
            {booking.customers.first_name} {booking.customers.last_name}
          </strong>{" "}
          · {dateStr}
        </span>
      </div>
    );
  }

  if (dispatched) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
        <span>✓</span>
        <span>
          Dispatched to <strong>{dispatchedName}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
        <span className="font-semibold text-gray-900">
          {booking.customers.first_name} {booking.customers.last_name}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">
          {dateStr} · {timeRange}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        {booking.customers.address}
        {aptSuffix}
        <span className="mx-2 text-gray-300">·</span>
        {booking.bedrooms}BR · {booking.service_summary}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedCleaner}
          onChange={(e) => setSelectedCleaner(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">— Select cleaner —</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
        <button
          onClick={handleDispatch}
          disabled={loading || !selectedCleaner}
          className="h-10 px-5 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
          style={{ backgroundColor: "#1d9e75" }}
          onMouseOver={(e) => {
            if (!loading && selectedCleaner) e.currentTarget.style.backgroundColor = "#085041";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#1d9e75";
          }}
        >
          {loading ? "Sending…" : "Assign & Dispatch"}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="h-10 px-3 rounded-lg border border-red-200 bg-white text-xs text-red-600 hover:border-red-400 disabled:opacity-50 whitespace-nowrap"
          title="Cancel this booking (duplicates, tests, customer cancellations)"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
