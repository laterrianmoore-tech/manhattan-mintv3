// Exact arrival windows live in cleaning_notes as "[Arrival window: 10:00am]"
// (the time labels on a booking are only Morning/Midday/Afternoon/Evening).
//
// Guard (2026-10-09): a booking cloned or rescheduled from an earlier visit
// can keep a stale tag that contradicts its time window. That printed
// "5:30pm (Morning)" in a reminder. So the tag is only surfaced when the
// time it names falls inside one of the booking's windows; otherwise the
// window label stands alone and the mismatch is logged for the owner.

const WINDOW_HOURS: Record<string, [number, number]> = {
  morning: [7, 12],
  midday: [10, 14],
  afternoon: [12, 17],
  evening: [16, 20],
};

export function rawArrivalTag(notes: string | null | undefined): string | null {
  const m = String(notes ?? "").match(/\[Arrival window:\s*([^\]]+)\]/i);
  return m ? m[1].trim() : null;
}

/** First clock time in a tag as a 24h decimal hour, or null when nothing parses ("flexible"). */
export function firstHourIn(tag: string): number | null {
  const m = tag.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  let ampm: string | undefined = m[3]?.toLowerCase();
  if (!ampm) {
    // "10:30-11am": borrow the meridiem that follows the range.
    const later = tag.slice(m.index! + m[0].length).match(/\b(am|pm)\b/i);
    ampm = later?.[1].toLowerCase();
  }
  if (h < 1 || h > 12 && ampm) return null;
  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (!ampm && h <= 6) h += 12; // "5:30" with no meridiem is an evening, not dawn
  return h + min / 60;
}

export function tagMatchesWindows(tag: string, ranges: unknown): boolean {
  const hour = firstHourIn(tag);
  if (hour == null) return true; // nothing to contradict
  const list = Array.isArray(ranges) ? ranges : typeof ranges === "string" ? ranges.split(",") : [];
  const known = list.map((r) => WINDOW_HOURS[String(r).trim().toLowerCase()]).filter(Boolean) as [number, number][];
  if (!known.length) return true; // no window on the booking, trust the tag
  return known.some(([start, end]) => hour >= start && hour <= end);
}

/**
 * The arrival tag to show people, or null when it contradicts the booking's
 * windows. `context` is only for the log line.
 */
export function arrivalTagFor(
  booking: { id?: string; cleaning_notes?: string | null; preferred_time_ranges?: unknown },
  context = "",
): string | null {
  const tag = rawArrivalTag(booking.cleaning_notes);
  if (!tag) return null;
  if (tagMatchesWindows(tag, booking.preferred_time_ranges)) return tag;
  console.warn(
    `[arrival-window] ${context} booking ${booking.id ?? "?"}: tag "${tag}" contradicts window ${JSON.stringify(booking.preferred_time_ranges)}; tag suppressed`,
  );
  return null;
}

/** Placeholder addresses minted for phone-only customers never reach anyone. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return /@nomail\.manhattanmintnyc\.local$/i.test(String(email ?? ""));
}
