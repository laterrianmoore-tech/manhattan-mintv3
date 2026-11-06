"use client";

import { useEffect, useState } from "react";
import { completeOpensAt, MIN_MINUTES_ON_SITE, nyClock } from "@/lib/tap-guards";

type EventType = "on_the_way" | "arrived" | "completed" | "locked_out";

interface Props {
  token: string;
  bookingId: string;
  customerFirstName: string;
  onTheWayAt: string | null;
  /** ISO instant "On the way" goes live (90 min before the window), null = no window to hold it to. */
  onTheWayOpensAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  isFuture: boolean;
  /** "Can't get in" (2026-10-28). Undefined on a database without the lockout columns: the button is hidden. */
  lockedOutAt?: string | null;
  lockoutResolvedAt?: string | null;
  lockoutEnabled?: boolean;
}

export default function JobActions({
  token,
  bookingId,
  customerFirstName,
  onTheWayAt,
  onTheWayOpensAt,
  arrivedAt,
  completedAt,
  isFuture,
  lockedOutAt,
  lockoutResolvedAt,
  lockoutEnabled = false,
}: Props) {
  const [onWay, setOnWay] = useState(!!onTheWayAt);
  const [arrived, setArrived] = useState(!!arrivedAt);
  // Kept so the "Mark complete" timer runs from the real tap, including one made on this screen.
  const [arrivedStamp, setArrivedStamp] = useState<string | null>(arrivedAt);
  const [completed, setCompleted] = useState(!!completedAt);
  // Timer running: tapped and the owner hasn't resolved it yet.
  const [lockedOut, setLockedOut] = useState(!!lockedOutAt && !lockoutResolvedAt);
  const [loading, setLoading] = useState<EventType | null>(null);
  const [error, setError] = useState("");

  // Time-based locks (2026-11-06): "On the way" waits for the window, "Mark
  // complete" waits 30 minutes after "Arrived". The API enforces the same
  // limits; this just keeps the button grey until then. Re-render every
  // 30 seconds so a button unlocks on its own while the page sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const onWayOpens = onTheWayOpensAt ? new Date(onTheWayOpensAt) : null;
  const onWayTooEarly = !onWay && !!onWayOpens && now < onWayOpens.getTime();
  const completeOpens = completeOpensAt(arrivedStamp);
  const completeTooEarly = arrived && !completed && !!completeOpens && now < completeOpens.getTime();

  async function tap(event: EventType) {
    if (event === "locked_out" && !window.confirm("Can't get in? This texts the customer a 10-minute final warning and alerts the owner. Only tap it once you've knocked, called and texted.")) {
      return;
    }
    if (
      event === "completed" &&
      !window.confirm(`All done at ${customerFirstName}'s? This texts them that the clean is complete and bills the job. Only tap it when you've finished and are leaving.`)
    ) {
      return;
    }
    setLoading(event);
    setError("");

    const res = await fetch("/api/job-event/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, bookingId, event }),
    });

    setLoading(null);

    if (res.ok) {
      if (event === "on_the_way") setOnWay(true);
      if (event === "arrived") {
        setArrived(true);
        setArrivedStamp(new Date().toISOString());
        setNow(Date.now());
      }
      if (event === "completed") setCompleted(true);
      if (event === "locked_out") setLockedOut(true);
    } else {
      // The API refuses out-of-order or too-early taps with a plain reason —
      // show that rather than a generic error.
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mt-4 space-y-2.5">
      <ActionButton
        label={onWayTooEarly && onWayOpens ? `On the way — unlocks ${nyClock(onWayOpens)}` : "On the way"}
        done={onWay}
        loading={loading === "on_the_way"}
        disabled={onWay || loading !== null || isFuture || onWayTooEarly}
        onClick={() => tap("on_the_way")}
        primaryColor="#1d9e75"
      />
      <ActionButton
        label="Arrived"
        done={arrived}
        loading={loading === "arrived"}
        disabled={arrived || loading !== null || !onWay}
        onClick={() => tap("arrived")}
        primaryColor="#1d9e75"
      />
      <ActionButton
        label={completeTooEarly && completeOpens ? `Mark complete — unlocks ${nyClock(completeOpens)}` : "Mark complete"}
        done={completed}
        loading={loading === "completed"}
        disabled={completed || loading !== null || !arrived || completeTooEarly}
        onClick={() => tap("completed")}
        primaryColor="#085041"
      />
      {completeTooEarly && (
        <p className="text-xs text-gray-400 pt-1">
          Mark complete unlocks {MIN_MINUTES_ON_SITE} minutes after you arrive. Tap it when the clean is finished.
        </p>
      )}
      {lockoutEnabled && arrived && !completed && (
        <>
          <ActionButton
            label={lockedOut ? "Can't get in — owner notified" : "Can't get in"}
            done={lockedOut}
            loading={loading === "locked_out"}
            disabled={lockedOut || loading !== null}
            onClick={() => tap("locked_out")}
            primaryColor="#b45309"
          />
          {lockedOut && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              The customer has 10 minutes to let you in. Wait by the door; the owner will text you whether to go in or head home. If they open up, just carry on and tap Mark complete when you&apos;re done.
            </p>
          )}
        </>
      )}
      {isFuture && !completed && (
        <p className="text-xs text-gray-400 pt-1">Buttons unlock on the day of the job.</p>
      )}
      {onWayTooEarly && !isFuture && (
        <p className="text-xs text-gray-400 pt-1">Tap On the way when you actually leave for this job — it texts the customer that you&apos;re coming.</p>
      )}
      {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
    </div>
  );
}

function ActionButton({
  label,
  done,
  loading,
  disabled,
  onClick,
  primaryColor,
}: {
  label: string;
  done: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  primaryColor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[15px] transition-all select-none"
      style={{
        minHeight: 52,
        backgroundColor: done ? "#e1f5ee" : disabled && !loading ? "#e5e7eb" : primaryColor,
        color: done ? "#085041" : disabled && !loading ? "#9ca3af" : "#fff",
        border: done ? "1.5px solid #1d9e75" : "none",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {loading ? (
        <span className="opacity-80">Sending…</span>
      ) : done ? (
        <>
          <span style={{ color: "#1d9e75" }}>✓</span>
          <span>{label}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
