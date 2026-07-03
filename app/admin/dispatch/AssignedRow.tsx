"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  service_date: string;
  service_summary: string;
  status: string;
  dispatch_sms_sent_at: string | null;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
  };
};

export default function AssignedRow({
  booking,
  cleanerName,
}: {
  booking: Booking;
  cleanerName: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const customer = booking.customers;
  const dateStr = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
    const res = await fetch("/api/bookings/cancel", {
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

  async function handleReschedule() {
    if (!newDate) {
      setError("Pick a new date first.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, newDate }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(data.cleanerNotified ? "Rescheduled — cleaner texted." : "Rescheduled.");
      setRescheduling(false);
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

      <div className="flex flex-wrap items-center gap-2">
        {rescheduling ? (
          <>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
            />
            <button
              onClick={handleReschedule}
              disabled={busy || !newDate}
              className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: "#1d9e75" }}
            >
              {busy ? "Saving…" : "Confirm new date"}
            </button>
            <button
              onClick={() => {
                setRescheduling(false);
                setError("");
              }}
              disabled={busy}
              className="px-3 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setRescheduling(true)}
              disabled={busy}
              className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="px-3 py-1 rounded-lg border border-red-200 bg-white text-xs text-red-600 hover:border-red-400"
            >
              {busy ? "Canceling…" : "Cancel job"}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
