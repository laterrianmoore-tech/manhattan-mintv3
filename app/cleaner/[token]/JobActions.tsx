"use client";

import { useState } from "react";

type EventType = "on_the_way" | "arrived" | "completed";

interface Props {
  token: string;
  bookingId: string;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
}

export default function JobActions({
  token,
  bookingId,
  onTheWayAt,
  arrivedAt,
  completedAt,
}: Props) {
  const [onWay, setOnWay] = useState(!!onTheWayAt);
  const [arrived, setArrived] = useState(!!arrivedAt);
  const [completed, setCompleted] = useState(!!completedAt);
  const [loading, setLoading] = useState<EventType | null>(null);
  const [error, setError] = useState("");

  async function tap(event: EventType) {
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
      if (event === "arrived") setArrived(true);
      if (event === "completed") setCompleted(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mt-4 space-y-2.5">
      <ActionButton
        label="On the way"
        done={onWay}
        loading={loading === "on_the_way"}
        disabled={onWay || loading !== null}
        onClick={() => tap("on_the_way")}
        primaryColor="#1d9e75"
      />
      <ActionButton
        label="Arrived"
        done={arrived}
        loading={loading === "arrived"}
        disabled={arrived || loading !== null}
        onClick={() => tap("arrived")}
        primaryColor="#1d9e75"
      />
      <ActionButton
        label="Mark complete"
        done={completed}
        loading={loading === "completed"}
        disabled={completed || loading !== null}
        onClick={() => tap("completed")}
        primaryColor="#085041"
      />
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
