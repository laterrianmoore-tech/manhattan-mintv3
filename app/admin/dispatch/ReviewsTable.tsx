"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Owner-facing view of review-link tracking: who was sent the Google review
// link, who tapped it, who got the day-3 nudge, and who actually reviewed.
// Google gives no signal when a review lands, so "Received" is marked by hand.
export type ReviewRow = {
  id: string;
  service_date: string;
  customer: string;
  review_link_sent_at: string | null;
  review_link_clicked_at: string | null;
  review_nudge_sent_at: string | null;
  review_received_at: string | null;
};

function fmtDay(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function Stamp({ at, title }: { at: string | null; title: string }) {
  return at ? (
    <span className="text-xs font-medium" style={{ color: "#085041" }} title={`${title} ${new Date(at).toLocaleString("en-US", { timeZone: "America/New_York" })}`}>
      ✓ {fmtDay(at)}
    </span>
  ) : (
    <span className="text-gray-300 text-xs" title={`${title}: no`}>
      —
    </span>
  );
}

export default function ReviewsTable({ rows }: { rows: ReviewRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function setReceived(row: ReviewRow, received: boolean) {
    if (received && !window.confirm(`Mark ${row.customer}'s Google review as received?`)) return;
    setBusyId(row.id);
    setError("");
    const res = await fetch("/api/bookings/review-received/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: row.id, received }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update. Try again.");
      return;
    }
    router.refresh();
  }

  if (!rows.length) {
    return <p className="text-sm text-gray-400">No review links sent yet.</p>;
  }

  return (
    <div className="rounded-xl bg-gray-50 text-sm overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2 font-semibold">Client</th>
            <th className="px-2 py-2 font-semibold">Clean</th>
            <th className="px-2 py-2 font-semibold">Link sent</th>
            <th className="px-2 py-2 font-semibold">Clicked</th>
            <th className="px-2 py-2 font-semibold">Nudged</th>
            <th className="px-2 py-2 font-semibold">Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white">
              <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{r.customer}</td>
              <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{fmtDay(r.service_date + "T12:00:00")}</td>
              <td className="px-2 py-2 whitespace-nowrap"><Stamp at={r.review_link_sent_at} title="Sent" /></td>
              <td className="px-2 py-2 whitespace-nowrap"><Stamp at={r.review_link_clicked_at} title="Clicked" /></td>
              <td className="px-2 py-2 whitespace-nowrap"><Stamp at={r.review_nudge_sent_at} title="Nudged" /></td>
              <td className="px-2 py-2 whitespace-nowrap">
                {r.review_received_at ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "#1d9e75" }}>
                      Y · {fmtDay(r.review_received_at)}
                    </span>
                    <button
                      onClick={() => setReceived(r, false)}
                      disabled={busyId === r.id}
                      className="text-[11px] text-gray-400 hover:text-gray-600"
                      title="Undo — mark as not received"
                    >
                      undo
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-gray-400">N</span>
                    <button
                      onClick={() => setReceived(r, true)}
                      disabled={busyId === r.id}
                      className="px-2 py-0.5 rounded-lg text-white text-[11px] font-medium disabled:opacity-50"
                      style={{ backgroundColor: "#1d9e75" }}
                    >
                      {busyId === r.id ? "Saving…" : "Mark received"}
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
