"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScheduleEditor from "./ScheduleEditor";
import PriceEditor from "./PriceEditor";

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
  pricing_total: number;
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
  // Optional teammate — a 2-person job. Dispatched right after the first cleaner.
  const [selectedSecond, setSelectedSecond] = useState("");
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [dispatchedName, setDispatchedName] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState("");
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
      const data = await res.json().catch(() => ({}));
      const name = cleaners.find((c) => c.id === selectedCleaner);
      const cleanerName = name ? `${name.first_name} ${name.last_name}` : "cleaner";
      if (data.smsSent === false) {
        setError(
          `Assigned to ${cleanerName}, but the job TEXT DID NOT SEND — text them manually. (${data.smsError ?? "unknown error"})`
        );
        setLoading(false);
        router.refresh();
        return;
      }

      // Second cleaner, if one was picked. The job is already assigned to the
      // first cleaner at this point, so a failure here is reported, not fatal.
      let label = cleanerName;
      if (selectedSecond && selectedSecond !== selectedCleaner) {
        const second = cleaners.find((c) => c.id === selectedSecond);
        const secondName = second ? `${second.first_name} ${second.last_name}` : "2nd cleaner";
        const res2 = await fetch("/api/dispatch/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id, cleanerId: selectedSecond, slot: "second" }),
        });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) {
          setError(
            `Assigned to ${cleanerName} and texted, but adding ${secondName} failed: ${data2.error ?? "unknown error"}. Add them from the Assigned list.`
          );
          setLoading(false);
          router.refresh();
          return;
        }
        if (data2.smsSent === false) {
          setError(
            `Assigned to ${cleanerName} + ${secondName}, but ${secondName}'s job TEXT DID NOT SEND — text them manually. (${data2.smsError ?? "unknown error"})`
          );
          setLoading(false);
          router.refresh();
          return;
        }
        label = `${cleanerName} + ${secondName}`;
      }

      setDispatchedName(label);
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
        <span className="mx-2 text-gray-300">·</span>
        <span className="font-semibold text-gray-800">${booking.pricing_total}</span>
      </div>
      {editingSchedule ? (
        <ScheduleEditor
          bookingId={booking.id}
          initialDate={booking.service_date}
          initialRanges={
            Array.isArray(booking.preferred_time_ranges) ? booking.preferred_time_ranges : []
          }
          onDone={() => {
            setEditingSchedule(false);
            setScheduleNotice("Schedule updated.");
            router.refresh();
          }}
          onClose={() => setEditingSchedule(false)}
        />
      ) : editingPrice ? (
        <PriceEditor
          bookingId={booking.id}
          initialTotal={booking.pricing_total}
          onDone={(message) => {
            setEditingPrice(false);
            setScheduleNotice(message);
            router.refresh();
          }}
          onClose={() => setEditingPrice(false)}
        />
      ) : (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedCleaner}
          onChange={(e) => setSelectedCleaner(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">— Select cleaner —</option>
          {cleaners
            .filter((c) => c.id !== selectedSecond)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
        </select>
        <select
          value={selectedSecond}
          onChange={(e) => setSelectedSecond(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none"
          title="Optional — put a second cleaner on this job"
        >
          <option value="">+ 2nd cleaner (optional)</option>
          {cleaners
            .filter((c) => c.id !== selectedCleaner)
            .map((c) => (
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
          {loading ? "Sending…" : selectedSecond ? "Assign both & Dispatch" : "Assign & Dispatch"}
        </button>
        <button
          onClick={() => setEditingSchedule(true)}
          disabled={loading}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50 whitespace-nowrap"
          title="Change the day or time window"
        >
          Edit day / time
        </button>
        <button
          onClick={() => setEditingPrice(true)}
          disabled={loading}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400 disabled:opacity-50 whitespace-nowrap"
          title="Change what the card is charged at Job Complete"
        >
          Edit price
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
      )}
      {scheduleNotice && <p className="text-xs text-green-700">{scheduleNotice}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
