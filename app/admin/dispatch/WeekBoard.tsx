"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DAY_KEYS,
  DAY_SHORT,
  type BoardCleaner,
  type BoardJob,
  type DayKey,
  cleanerDayStatus,
  fmtDay,
  weekdayOf,
  worksOn,
} from "@/lib/availability";

// The week at a glance (2026-11-02): one row per cleaner, one column per day.
// A cell is a job (who, when), "free", or "off" (outside her usual days).
// The top row is the open work still waiting for a cleaner, so a gap in the
// grid under it is literally who can take it.
//
// "Usual days" are toggled on the row itself (the Mon..Sun chips) and saved
// to cleaners.available_days. Before that migration has run the chips are
// hidden and the board just shows free/booked.

const MINT = "#1d9e75";
const MINT_DARK = "#085041";

export default function WeekBoard({
  days,
  today,
  cleaners,
  jobs,
  availabilityEnabled,
  weekOffset,
}: {
  days: string[];
  today: string;
  cleaners: BoardCleaner[];
  jobs: BoardJob[];
  availabilityEnabled: boolean;
  weekOffset: number;
}) {
  const open = jobs.filter((j) => !j.assigned_cleaner_id);
  const [showQuiet, setShowQuiet] = useState(false);
  const quiet = cleaners.filter((c) => c.quiet);
  const shown = showQuiet ? cleaners : cleaners.filter((c) => !c.quiet);
  const first = days[0];
  const last = days[days.length - 1];

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Who&apos;s free this week</h2>
          <span className="text-xs text-gray-400">
            {fmtDay(first, { month: "short", day: "numeric" })} – {fmtDay(last, { month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {weekOffset > 0 && (
            <a
              href={weekOffset === 1 ? "/admin/dispatch/" : `/admin/dispatch/?week=${weekOffset - 1}`}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            >
              ← Back
            </a>
          )}
          {weekOffset > 0 && (
            <a href="/admin/dispatch/" className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-400">
              This week
            </a>
          )}
          <a
            href={`/admin/dispatch/?week=${weekOffset + 1}`}
            className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
          >
            Next week →
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 640 }}>
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 text-left font-semibold text-gray-500 px-3 py-2 w-28 sm:w-40 border-b border-gray-200 shadow-[2px_0_0_0_#e5e7eb]">
                Cleaner
              </th>
              {days.map((d) => {
                const isToday = d === today;
                const isPast = d < today;
                return (
                  <th
                    key={d}
                    className={`px-2 py-2 text-center font-semibold border-b border-l border-gray-200 ${isPast ? "text-gray-300" : "text-gray-600"}`}
                    style={isToday ? { color: MINT_DARK, backgroundColor: "#e1f5ee" } : undefined}
                  >
                    <div className="uppercase tracking-wide text-[10px]">{isToday ? "Today" : fmtDay(d, { weekday: "short" })}</div>
                    <div className="text-sm">{fmtDay(d, { month: "short", day: "numeric" })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Open jobs — what still needs a cleaner */}
            <tr className="bg-amber-50/60">
              <td className="sticky left-0 z-10 bg-amber-50 px-3 py-2 border-b border-gray-200 align-top shadow-[2px_0_0_0_#e5e7eb]">
                <div className="font-semibold text-amber-800">Open jobs</div>
                <div className="text-[10px] text-amber-700/80">no cleaner yet</div>
              </td>
              {days.map((d) => {
                const here = open.filter((j) => j.service_date === d);
                return (
                  <td key={d} className="px-1.5 py-1.5 border-b border-l border-gray-200 align-top" style={d === today ? { backgroundColor: "#fff7df" } : undefined}>
                    {here.length === 0 ? (
                      <span className="block text-center text-gray-300">—</span>
                    ) : (
                      <div className="space-y-1">
                        {here.map((j) => (
                          <a
                            key={j.id}
                            href={`#job-${j.id}`}
                            className="block rounded-md border border-amber-300 bg-white px-1.5 py-1 leading-tight hover:border-amber-500"
                            title={`${j.customer} — needs a cleaner`}
                          >
                            <span className="font-semibold text-amber-900">{j.customer}</span>
                            {j.window && <span className="text-amber-700"> {j.window}</span>}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {shown.map((c) => (
              <CleanerRow key={c.id} cleaner={c} days={days} today={today} jobs={jobs} availabilityEnabled={availabilityEnabled} />
            ))}
            {quiet.length > 0 && (
              <tr>
                <td colSpan={days.length + 1} className="px-3 py-1.5 bg-gray-50 text-[11px] text-gray-500">
                  <button onClick={() => setShowQuiet((v) => !v)} className="hover:underline" style={{ color: MINT_DARK }}>
                    {showQuiet ? "Hide" : "Show"} {quiet.length} more {quiet.length === 1 ? "cleaner" : "cleaners"} with no jobs in 90 days
                  </button>
                  {!showQuiet && <span className="text-gray-400"> · {quiet.map((c) => c.first_name).join(", ")}</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#e1f5ee", border: `1px solid ${MINT}` }} /> free
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: MINT }} /> booked
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> off (outside her usual days)
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm bg-white border border-amber-300" /> open job
        </span>
        {availabilityEnabled ? (
          <span className="text-gray-400">Tap a Mon–Sun chip under a name to set the days she usually works.</span>
        ) : (
          <span className="text-amber-700">
            To mark usual days off, run <code className="text-[10px] break-all">lib/supabase/migrations/2026-11-02-cleaner-available-days.sql</code> in Supabase.
          </span>
        )}
      </div>
    </section>
  );
}

function CleanerRow({
  cleaner,
  days,
  today,
  jobs,
  availabilityEnabled,
}: {
  cleaner: BoardCleaner;
  days: string[];
  today: string;
  jobs: BoardJob[];
  availabilityEnabled: boolean;
}) {
  const router = useRouter();
  const [usual, setUsual] = useState<string[]>(Array.isArray(cleaner.available_days) ? cleaner.available_days : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const live: BoardCleaner = { ...cleaner, available_days: usual };

  async function toggle(day: DayKey) {
    const next = usual.includes(day) ? usual.filter((d) => d !== day) : [...usual, day];
    const before = usual;
    setUsual(next);
    setSaving(true);
    setError("");
    const res = await fetch("/api/cleaners/availability/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanerId: cleaner.id, days: next }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setUsual(before);
      setError(data.error ?? "Could not save.");
      return;
    }
    router.refresh();
  }

  const freeCount = days.filter((d) => d >= today && cleanerDayStatus(live, d, jobs).kind === "free").length;

  return (
    <tr>
      <td className="sticky left-0 z-10 bg-white px-3 py-2 border-b border-gray-200 align-top shadow-[2px_0_0_0_#e5e7eb]">
        <div className="font-semibold text-gray-900 text-sm">{cleaner.first_name}</div>
        {cleaner.available_hours && (
          <div className="text-[10px] font-medium" style={{ color: MINT_DARK }} title="Hours she usually works">
            {cleaner.available_hours}
          </div>
        )}
        <div className="text-[10px] text-gray-400">
          {freeCount === 0 ? "no free days" : `${freeCount} free day${freeCount === 1 ? "" : "s"}`}
          {saving && <span className="ml-1" style={{ color: MINT }}>saving…</span>}
        </div>
        {availabilityEnabled && (
          <div className="flex gap-0.5 mt-1.5" title="Days she usually works. None selected = any day.">
            {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as DayKey[]).map((d) => {
              const on = usual.length === 0 ? null : usual.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggle(d)}
                  disabled={saving}
                  className="w-5 h-5 rounded text-[9px] font-semibold leading-none transition-colors"
                  style={{
                    backgroundColor: on === true ? MINT : on === null ? "#f3f4f6" : "#fff",
                    color: on === true ? "#fff" : on === null ? "#9ca3af" : "#d1d5db",
                    border: on === true ? `1px solid ${MINT}` : "1px solid #e5e7eb",
                  }}
                  title={`${DAY_SHORT[d]}${on === true ? " — usually works" : on === false ? " — usually off" : ""}`}
                >
                  {DAY_SHORT[d][0]}
                </button>
              );
            })}
          </div>
        )}
        {error && <div className="text-[10px] text-red-600 mt-1">{error}</div>}
      </td>
      {days.map((d) => {
        const s = cleanerDayStatus(live, d, jobs);
        const isPast = d < today;
        const isToday = d === today;
        const dow = weekdayOf(d);
        const base = "px-1.5 py-1.5 border-b border-l border-gray-200 align-top";
        if (s.kind === "busy") {
          return (
            <td key={d} className={base} style={isToday ? { backgroundColor: "#f3fbf8" } : undefined}>
              <div className="space-y-1">
                {s.jobs.map((j) => {
                  const second = j.second_cleaner_id === cleaner.id;
                  return (
                    <div
                      key={j.id}
                      className="rounded-md px-1.5 py-1 leading-tight text-white"
                      style={{ backgroundColor: isPast ? "#9fd7c4" : second ? MINT_DARK : MINT }}
                      title={`${j.customer}${j.window ? " · " + j.window : ""}${second ? " · 2nd cleaner" : ""}${j.status === "in_progress" ? " · in progress" : ""}`}
                    >
                      <span className="font-semibold">{j.customer}</span>
                      {j.window && <span className="opacity-90"> {j.window}</span>}
                      {second && <span className="opacity-80"> +2nd</span>}
                    </div>
                  );
                })}
              </div>
            </td>
          );
        }
        if (s.kind === "off" || !worksOn(live, dow)) {
          return (
            <td key={d} className={`${base} bg-gray-50 text-center text-gray-300`} title={`Usually off ${DAY_SHORT[dow]}`}>
              off
            </td>
          );
        }
        if (isPast) {
          return (
            <td key={d} className={`${base} text-center text-gray-200`}>
              —
            </td>
          );
        }
        return (
          <td key={d} className={`${base} text-center font-semibold`} style={{ backgroundColor: "#e1f5ee", color: MINT_DARK }} title={`${cleaner.first_name} is free ${DAY_SHORT[dow]}`}>
            free
          </td>
        );
      })}
    </tr>
  );
}
