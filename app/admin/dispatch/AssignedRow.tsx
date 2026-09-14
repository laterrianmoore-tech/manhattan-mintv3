"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScheduleEditor from "./ScheduleEditor";
import PriceEditor from "./PriceEditor";

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
  second_cleaner_id: string | null;
  dispatch_sms_sent_at: string | null;
  on_the_way_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  preferred_time_ranges: string[] | null;
  pricing_total: number;
  customers: {
    first_name: string;
    last_name: string;
    address: string;
  };
};

type JobEvent = "on_the_way" | "arrived" | "completed";
type Slot = "primary" | "second";

export default function AssignedRow({
  booking,
  cleanerName,
  secondCleanerName,
  cleaners,
}: {
  booking: Booking;
  cleanerName: string | null;
  secondCleanerName?: string | null;
  cleaners: Cleaner[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  // Which cleaner slot the picker below is editing; null = picker closed.
  const [switching, setSwitching] = useState<Slot | null>(null);
  const [repricing, setRepricing] = useState(false);
  const [newCleaner, setNewCleaner] = useState("");
  const [onWayAt, setOnWayAt] = useState(booking.on_the_way_at);
  const [arrivedAt, setArrivedAt] = useState(booking.arrived_at);
  const [completedAt, setCompletedAt] = useState(booking.completed_at);
  const [stepBusy, setStepBusy] = useState<JobEvent | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const customer = booking.customers;
  // Same guards /api/job-event enforces: steps in order, nothing before the day.
  const todayNy = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const isFuture = booking.service_date > todayNy;
  const dateStr = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeRange = Array.isArray(booking.preferred_time_ranges)
    ? booking.preferred_time_ranges.join(", ")
    : "";

  // Fires the same /api/job-event the cleaner's own portal uses. The admin
  // path is there for jobs where the cleaner has no portal token (an outside
  // cover) or cannot tap it themselves.
  async function handleStep(event: JobEvent) {
    const confirmText: Record<JobEvent, string> = {
      on_the_way: `Text ${customer?.first_name} that the cleaner is on the way?`,
      arrived: `Text ${customer?.first_name} that the cleaner has arrived?`,
      completed: `Mark ${customer?.first_name}'s job complete? This charges the card $${booking.pricing_total}, texts the review link, and books the next recurring visit.`,
    };
    if (!window.confirm(confirmText[event])) return;

    setStepBusy(event);
    setError("");
    const res = await fetch("/api/job-event/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, event }),
    });
    const data = await res.json().catch(() => ({}));
    setStepBusy(null);

    if (!res.ok) {
      setError(data.error ?? "Could not update the job. Try again.");
      return;
    }

    const now = new Date().toISOString();
    if (event === "on_the_way") setOnWayAt(now);
    if (event === "arrived") {
      setArrivedAt(now);
      if (!onWayAt) setOnWayAt(now);
    }
    if (event === "completed") {
      setCompletedAt(now);
      setNotice(
        data.alreadyCompleted
          ? "Already completed — nothing re-charged."
          : "Job complete — card charged, customer texted."
      );
    }
    router.refresh();
  }

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

  async function handleSwitchCleaner(slot: Slot) {
    if (!newCleaner) {
      setError("Select the cleaner first.");
      return;
    }
    const name = cleaners.find((c) => c.id === newCleaner);
    const picked = name?.first_name ?? "this cleaner";
    const isSecond = slot === "second";
    const replacingSecond = isSecond && !!booking.second_cleaner_id;
    const confirmText = isSecond
      ? replacingSecond
        ? `Swap the 2nd cleaner on ${customer?.first_name}'s ${dateStr} job to ${picked}? ${picked} gets the job text${
            booking.dispatch_sms_sent_at ? ` and ${secondCleanerName ?? "the current 2nd cleaner"} is told they're off it` : ""
          }.`
        : `Add ${picked} as a 2nd cleaner on ${customer?.first_name}'s ${dateStr} job? ${picked} gets the job text${
            booking.dispatch_sms_sent_at ? ` and ${cleanerName ?? "the first cleaner"} is told they have a teammate` : ""
          }.`
      : `Move ${customer?.first_name}'s ${dateStr} job to ${picked}? ${picked} gets the job text${
          booking.dispatch_sms_sent_at ? ` and ${cleanerName ?? "the current cleaner"} is told they're off it` : ""
        }.`;
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/dispatch/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, cleanerId: newCleaner, slot }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const verb = isSecond ? (replacingSecond ? "2nd cleaner swapped to" : "2nd cleaner added:") : "Moved to";
      if (data.smsSent === false) {
        setError(
          `${verb} ${picked}, but the job TEXT DID NOT SEND — text them manually. (${data.smsError ?? "unknown error"})`
        );
        setSwitching(null);
        setBusy(false);
        router.refresh();
        return;
      }
      const extra = data.previousCleanerNotified
        ? " — both cleaners texted."
        : data.teammateNotified
          ? ` — ${picked} and ${cleanerName ?? "the first cleaner"} texted.`
          : " — job text sent.";
      setNotice(`${verb} ${picked}${extra}`);
      setSwitching(null);
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  async function handleRemoveSecond() {
    if (
      !window.confirm(
        `Take ${secondCleanerName ?? "the 2nd cleaner"} off ${customer?.first_name}'s ${dateStr} job?${
          booking.dispatch_sms_sent_at ? " They'll be texted that they're off it." : ""
        } ${cleanerName ?? "The first cleaner"} keeps the job.`
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/dispatch/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id, cleanerId: null, slot: "second" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(
        data.previousCleanerNotified
          ? `${secondCleanerName ?? "2nd cleaner"} removed — texted.`
          : `${secondCleanerName ?? "2nd cleaner"} removed.`
      );
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
            {!completedAt && arrivedAt && (
              <span className="ml-2 text-xs font-semibold text-amber-600">IN PROGRESS</span>
            )}
            {!completedAt && !arrivedAt && onWayAt && (
              <span className="ml-2 text-xs font-semibold text-blue-600">ON THE WAY</span>
            )}
          </div>
          <div className="text-gray-500 text-xs truncate mt-0.5">
            {customer?.address} &middot; {booking.service_summary} &middot;{" "}
            <span className="font-semibold text-gray-700">${booking.pricing_total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {cleanerName && (
            <span className="text-gray-600 text-xs">
              {cleanerName}
              {secondCleanerName && (
                <>
                  {" "}
                  <span className="text-gray-400">+</span> {secondCleanerName}
                </>
              )}
            </span>
          )}
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

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <StepButton
          label="On the way"
          at={onWayAt}
          busy={stepBusy === "on_the_way"}
          disabled={busy || stepBusy !== null || !!onWayAt || !!completedAt || isFuture}
          onClick={() => handleStep("on_the_way")}
        />
        <StepButton
          label="Arrived"
          at={arrivedAt}
          busy={stepBusy === "arrived"}
          disabled={busy || stepBusy !== null || !!arrivedAt || !!completedAt || !onWayAt}
          onClick={() => handleStep("arrived")}
        />
        <StepButton
          label="Complete"
          at={completedAt}
          busy={stepBusy === "completed"}
          disabled={busy || stepBusy !== null || !!completedAt || !arrivedAt || isFuture}
          onClick={() => handleStep("completed")}
          emphasis
        />
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
      ) : repricing ? (
        <PriceEditor
          bookingId={booking.id}
          initialTotal={booking.pricing_total}
          onDone={(message) => {
            setNotice(message);
            setRepricing(false);
            router.refresh();
          }}
          onClose={() => {
            setRepricing(false);
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
            <option value="">{switching === "second" ? "— 2nd cleaner —" : "— New cleaner —"}</option>
            {cleaners
              .filter((c) => c.id !== booking.assigned_cleaner_id && c.id !== booking.second_cleaner_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
          </select>
          <button
            onClick={() => handleSwitchCleaner(switching)}
            disabled={busy || !newCleaner}
            className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1d9e75" }}
          >
            {busy
              ? "Sending…"
              : switching === "second"
                ? booking.second_cleaner_id
                  ? "Swap & text"
                  : "Add & text"
                : "Switch & text"}
          </button>
          <button
            onClick={() => {
              setSwitching(null);
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
            onClick={() => {
              setNewCleaner("");
              setSwitching("primary");
            }}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
          >
            Change cleaner
          </button>
          <button
            onClick={() => {
              setNewCleaner("");
              setSwitching("second");
            }}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
            title="Put a second cleaner on this job — both see it in their portal and get the texts"
          >
            {booking.second_cleaner_id ? "Change 2nd cleaner" : "+ 2nd cleaner"}
          </button>
          {booking.second_cleaner_id && (
            <button
              onClick={handleRemoveSecond}
              disabled={busy}
              className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-500 hover:border-gray-400"
            >
              Remove 2nd
            </button>
          )}
          <button
            onClick={() => setRepricing(true)}
            disabled={busy}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 hover:border-gray-400"
            title="Change what the card is charged at Job Complete"
          >
            Edit price
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

function fmtTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" ", "")
    .toLowerCase();
}

function StepButton({
  label,
  at,
  busy,
  disabled,
  onClick,
  emphasis,
}: {
  label: string;
  at: string | null;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  emphasis?: boolean;
}) {
  const done = !!at;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={done ? `${label} at ${fmtTime(at)}` : label}
      className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: done ? "#e1f5ee" : emphasis ? "#085041" : "#1d9e75",
        color: done ? "#085041" : "#fff",
        border: done ? "1.5px solid #1d9e75" : "none",
        opacity: disabled && !done && !busy ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {busy ? "Sending…" : done ? `✓ ${label} ${fmtTime(at)}` : label}
    </button>
  );
}
