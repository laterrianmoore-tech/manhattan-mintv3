// Cleaner-portal tap guards (2026-11-06).
//
// The portal's three buttons fire customer texts and, on Mark complete, the
// charge. Erika's history showed two habits the order-only guards let through:
// tapping "On the way" for every job of the day at 8am (customers texted hours
// early), and tapping "Mark complete" the moment she arrived (completion text
// + billing while she was walking in). These helpers are shared by the page,
// the button component and the API so the screen and the server agree on
// exactly when each button is live.

import { firstHourIn, rawArrivalTag, tagMatchesWindows } from "./arrival-window";

/** "On the way" is live this many minutes before the arrival window opens. */
export const ON_THE_WAY_LEAD_MINUTES = 90;
/** "Mark complete" is live this many minutes after "Arrived". */
export const MIN_MINUTES_ON_SITE = 30;

// Window labels → the hour the window opens (matches the quote page).
const WINDOW_OPENS: Record<string, number> = {
  morning: 8,
  midday: 10,
  afternoon: 12,
  evening: 16,
};

interface WindowSource {
  service_date: string;
  cleaning_notes?: string | null;
  preferred_time_ranges?: unknown;
}

/** The hour (24h decimal) the booking's arrival window opens, or null when the booking has no window at all. */
export function windowOpensHour(b: WindowSource): number | null {
  const tag = rawArrivalTag(b.cleaning_notes);
  if (tag && tagMatchesWindows(tag, b.preferred_time_ranges)) {
    const h = firstHourIn(tag);
    if (h != null) return h;
  }
  const list = Array.isArray(b.preferred_time_ranges)
    ? b.preferred_time_ranges
    : typeof b.preferred_time_ranges === "string"
      ? b.preferred_time_ranges.split(",")
      : [];
  const hours = list.map((r) => WINDOW_OPENS[String(r).trim().toLowerCase()]).filter((h): h is number => h != null);
  return hours.length ? Math.min(...hours) : null;
}

/** A New York wall-clock time on a YYYY-MM-DD date as a real instant (the server runs in UTC). */
export function nyTime(date: string, hourDecimal: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const h = Math.floor(hourDecimal);
  const min = Math.round((hourDecimal - h) * 60);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const shownAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return new Date(guess + (guess - shownAsUtc));
}

/** When "On the way" goes live for this booking, or null when there is no window to hold it to. */
export function onTheWayOpensAt(b: WindowSource): Date | null {
  const hour = windowOpensHour(b);
  if (hour == null) return null;
  return new Date(nyTime(b.service_date, hour).getTime() - ON_THE_WAY_LEAD_MINUTES * 60_000);
}

/** When "Mark complete" goes live, or null before "Arrived". */
export function completeOpensAt(arrivedAt: string | null | undefined): Date | null {
  if (!arrivedAt) return null;
  return new Date(new Date(arrivedAt).getTime() + MIN_MINUTES_ON_SITE * 60_000);
}

/**
 * Finish lock (2026-11-11): a job that runs over more than one day. The owner
 * puts "[Finish locked: continues Thu Nov 12 at 8:30am]" in cleaning_notes and
 * the cleaner can no longer tap "Mark complete" on it (no completion text, no
 * charge) until the owner closes it from /admin/dispatch or removes the tag.
 * A parked job (locked and already arrived) also stops counting as the job in
 * flight, so the follow-on visit gets its own buttons.
 */
export function finishLockNote(cleaningNotes: string | null | undefined): string | null {
  const m = /\[finish locked(?::\s*([^\]]*))?\]/i.exec(cleaningNotes ?? "");
  if (!m) return null;
  return (m[1] ?? "").trim() || "continues on another day";
}
export function finishLocked(b: { cleaning_notes?: string | null }): boolean {
  return finishLockNote(b.cleaning_notes) != null;
}

/** "8:30 AM" in New York time, for button labels and refusals. */
export function nyClock(d: Date): string {
  return d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
}
