"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScheduleEditor from "./ScheduleEditor";

type Cleaner = {
  id: string;
  first_name: string;
  last_name: string;
};

type Booking = {
  id: string;
  service_date: string;
  service_summary: string;
  status: string;
  assigned_cleaner_id: string;
  dispatch_sms_sent_at: string | null;
  preferred_time_ranges: string[] | null;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
  };
};

export default function AssignedRow({
  booking,
  cleanerName,
  cleaners,
}: {
  booking: Booking;
  cleanerName: string | null;
  cleaners: Cleaner[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [newCleaner, setNewCleaner] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const customer = booking.customers;
  const dateStr = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : "";

  async function handleCancel() {
    if (
      !window.confirm(
        `Cancel ${customer?.first_name}'s ${dateStr} job?${
          booking.dispatch_sms_sent_at ? " The cleaner will be texted a cancellation alert." : ""
        }`
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings/cancel/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(data.cleanerNotified ? "Canceled — cleaner texted." : "Canceled.");
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  async function handleSwitchCleaner() {
    if (!newCleaner) {
      setError("Select the new cleaner first.");
      return;
    }
    const name = cleaners.find((c) => c.id === newCleaner);
    if (
      !window.confirm(
        `Move ${customer?.first_name}'s ${dateStr} job to ${name?.first_name ?? "this cleaner"}? ${
          name?.first_name ?? "They"
        } gets the job text${
          booking.dispatch_sms_sent_at ? ` and ${cleanerName ?? "the current cleaner"} is told they're off it` : ""
        }.`
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/dispatch/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, cleanerId: newCleaner }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(
        data.previousCleanerNotified
          ? `Moved to ${name?.first_name ?? "new cleaner"} — both cleaners texted.`
          : `Moved to ${name?.first_name ?? "new cleaner"} — job text sent.`
      );
      setSwitching(false);
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  if (notice) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
        <span>✓</span>
        <span>
          <strong>
            {customer?.first_name} {customer?.last_name}
          </strong>{" "}
          — {notice}
        </span>
      </div>
    );
  }

  return (
    <div className="py-3 px-4 rounded-xl bg-gray-50 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 truncate">
            {customer?.first_name} {customer?.last_name} &middot; {dateStr}
            {timeRange && <span className="text-gray-500 font-normal"> &middot; {timeRange}</span>}
            {booking.status === "in_progress" && (
              <span className="ml-2 text-xs font-semibold text-amber-600">IN PROGRESS</span>
            )}
          </div>
          <div className="text-gray-500 text-xs truncate mt-0.5">
            {customer?.address} &middot; {booking.service_summary}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {cleanerName && <span className="text-gray-600 text-xs">{cleanerName}</span>}
          {booking.dispatch_sms_sent_at ? (
            <span className="text-base font-bold" style={{ color: "#1d9e75" }} title="SMS sent">
              ✓
            </span>
          ) : (
            <span className="text-gray-300 text-base" title="SMS not sent">
              ○
            </span>
          )}
        </div>
      </div>

      {rescheduling ? (
        <ScheduleEditor
          bookingId={booking.id}
          initialDate={booking.service_date}
          initialRanges={booking.preferred_time_ranges ?? []}
          onDone={(message) => {
            setNotice(message);
            setRescheduling(false);
            router.refresh();
          }}
          onClose={() => {
            setRescheduling(false);
            setError("");
          }}
        />
      ) : switching ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={newCleaner}
            onChange={(e) => setNewCleaner(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">— New cleaner —</option>
            {cleaners
              .filter((c) => c.id !== booking.assigned_cleaner_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
          </select>
          <button
            onClick={handleSwitchCleaner}
            disabled={busy || !newCleaner}
            className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1d9e75" }}
          >
            {busy ? "Switching…" : "Switch & text"}
          </button>
          <button
            onClick={() => {
              setSwitching(false);
              setError("");
            }}
            disabled={busy}
            className="px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRescheduling(true)}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
          >
            Edit day / time
          </button>
          <button
            onClick={() => setSwitching(true)}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
          >
            Change cleaner
          </button>
          <button
            onClick={handleCancel}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-red-200 bg-white text-xs text-red-600 hover:border-red-400"
          >
            {busy ? "Canceling…" : "Cancel job"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
