"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Owner's review to-do list (2026-10-20, replaces the status table). Nothing
// here is automatic: the owner taps "Text review ask" per customer, which
// sends his personal note with the Google link, then checks Google and taps
// "Mark received" when the review shows up. Received rows drop off the list.
export type ReviewActionRow = {
  id: string;
  service_date: string;
  customer: string;
  cleaner: string | null;
  review_link_clicked_at: string | null;
  owner_ask_sent_at: string | null; // bookings.review_nudge_sent_at
  review_received_at: string | null;
};

const GREEN = "#1d9e75";

function fmtDay(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
}

function daysAgo(serviceDate: string) {
  const ms = Date.now() - new Date(serviceDate + "T12:00:00-04:00").getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function ago(n: number) {
  return n === 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`;
}

export default function ReviewActions({
  rows,
  receivedThisMonth,
  rating,
}: {
  rows: ReviewActionRow[];
  receivedThisMonth: number;
  rating: { rating: number; count: number } | null;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function post(url: string, body: Record<string, unknown>, rowId: string) {
    setBusyId(rowId);
    setError("");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return false;
    }
    router.refresh();
    return true;
  }

  const open = rows.filter((r) => !r.review_received_at);
  const toAsk = open.filter((r) => !r.owner_ask_sent_at);
  const waiting = open.filter((r) => !!r.owner_ask_sent_at);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        <span className="text-gray-700">
          Google:{" "}
          {rating ? (
            <strong className="text-gray-900">
              {rating.rating.toFixed(1)} ★ · {rating.count} reviews
            </strong>
          ) : (
            <span className="text-gray-400">rating unavailable</span>
          )}
        </span>
        <span className="text-gray-700">
          Received this month: <strong className="text-gray-900">{receivedThisMonth}</strong>
        </span>
        <a href="https://g.page/r/CeslAughOLhZEBM/review" target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: GREEN }}>
          open Google reviews
        </a>
      </div>

      <Group
        title={`Text a review ask (${toAsk.length})`}
        hint="Your personal note with the Google link. Tap once per customer; it sends from the 914 line."
        empty="Nobody waiting on an ask."
      >
        {toAsk.map((r) => (
          <Row key={r.id} r={r}>
            <button
              onClick={async () => {
                if (!window.confirm(`Text ${r.customer} your review ask now?`)) return;
                await post("/api/bookings/review-ask/", { bookingId: r.id }, r.id);
              }}
              disabled={busyId === r.id}
              className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: GREEN }}
            >
              {busyId === r.id ? "Sending…" : "Text review ask"}
            </button>
            <MarkReceived r={r} busy={busyId === r.id} onClick={() => post("/api/bookings/review-received/", { bookingId: r.id, received: true }, r.id)} />
          </Row>
        ))}
      </Group>

      <Group
        title={`Check Google (${waiting.length})`}
        hint="You already asked. When the review shows up on Google, mark it received and it drops off."
        empty="Nothing to check."
      >
        {waiting.map((r) => (
          <Row key={r.id} r={r} asked>
            <MarkReceived r={r} busy={busyId === r.id} onClick={() => post("/api/bookings/review-received/", { bookingId: r.id, received: true }, r.id)} />
            <button
              onClick={async () => {
                if (!window.confirm(`Text ${r.customer} the review ask again?`)) return;
                await post("/api/bookings/review-ask/", { bookingId: r.id }, r.id);
              }}
              disabled={busyId === r.id}
              className="text-[11px] text-gray-400 hover:text-gray-600"
            >
              text again
            </button>
          </Row>
        ))}
      </Group>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Group({ title, hint, empty, children }: { title: string; hint: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-[11px] text-gray-400 mb-2">{hint}</p>
      {children.length ? <ul className="divide-y divide-white">{children}</ul> : <p className="text-xs text-gray-400 py-1">{empty}</p>}
    </div>
  );
}

function Row({ r, asked, children }: { r: ReviewActionRow; asked?: boolean; children: React.ReactNode }) {
  const n = daysAgo(r.service_date);
  return (
    <li className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="min-w-[180px] flex-1">
        <div className="text-sm font-medium text-gray-900">{r.customer}</div>
        <div className="text-[11px] text-gray-500">
          Clean {ago(n)}
          {r.cleaner ? ` with ${r.cleaner}` : ""}
          {r.review_link_clicked_at ? " · tapped the link" : " · hasn't tapped the link"}
          {asked && r.owner_ask_sent_at ? ` · you asked ${fmtDay(r.owner_ask_sent_at)}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </li>
  );
}

function MarkReceived({ r, busy, onClick }: { r: ReviewActionRow; busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        if (window.confirm(`Mark ${r.customer}'s Google review as received?`)) onClick();
      }}
      disabled={busy}
      className="px-3 py-1 rounded-lg text-xs font-medium border disabled:opacity-50"
      style={{ borderColor: GREEN, color: GREEN }}
    >
      Mark received
    </button>
  );
}
