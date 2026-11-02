// Who is free on which day (2026-11-02).
//
// Nothing about a cleaner's schedule used to be stored anywhere: the owner
// kept it in their head and the dispatch page was one long list of jobs. This
// module works availability out from two things:
//
//   1. The bookings themselves — a cleaner with a job on a day is "busy".
//   2. cleaners.available_days — the days she usually works (set from the
//      week board). A day outside that list is "off". Null means "not set",
//      so every day without a job reads as "free".
//
// Pure functions only; used by the server page, the week board and the
// cleaner picker on each open job.

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_SHORT: Record<DayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

export const DAY_PLURAL: Record<DayKey, string> = {
  sun: "Sundays",
  mon: "Mondays",
  tue: "Tuesdays",
  wed: "Wednesdays",
  thu: "Thursdays",
  fri: "Fridays",
  sat: "Saturdays",
};

export type BoardJob = {
  id: string;
  service_date: string;
  status: string;
  customer: string;
  window: string;
  assigned_cleaner_id: string | null;
  second_cleaner_id: string | null;
};

export type BoardCleaner = {
  id: string;
  first_name: string;
  available_days?: string[] | null;
  /** No job in the last 90 days and no usual days set — placeholders, trial
   *  accounts, people who drifted off. Kept out of the way, never removed. */
  quiet?: boolean;
};

export type CleanerDayStatus =
  | { kind: "free"; detail: string }
  | { kind: "busy"; detail: string; jobs: BoardJob[] }
  | { kind: "off"; detail: string };

/** Today's date in New York as YYYY-MM-DD, the same form service_date uses. */
export function todayNy(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string): DayKey {
  return DAY_KEYS[new Date(iso + "T12:00:00Z").getUTCDay()];
}

export function fmtDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", opts);
}

/** "Morning" → "AM", "Afternoon, Evening" → "PM/Eve": short enough for a board cell. */
export function shortWindow(ranges: unknown): string {
  if (!Array.isArray(ranges) || ranges.length === 0) return "";
  const map: Record<string, string> = { Morning: "AM", Midday: "Mid", Afternoon: "PM", Evening: "Eve" };
  return ranges.map((r) => map[String(r)] ?? String(r)).join("/");
}

/** Null or empty means "not set": we don't know her days, so nothing is "off". */
export function worksOn(cleaner: BoardCleaner, day: DayKey): boolean {
  const days = cleaner.available_days;
  if (!Array.isArray(days) || days.length === 0) return true;
  return days.includes(day);
}

export function jobsFor(cleanerId: string, date: string, jobs: BoardJob[]): BoardJob[] {
  return jobs.filter(
    (j) => j.service_date === date && (j.assigned_cleaner_id === cleanerId || j.second_cleaner_id === cleanerId),
  );
}

export function cleanerDayStatus(cleaner: BoardCleaner, date: string, jobs: BoardJob[]): CleanerDayStatus {
  const day = weekdayOf(date);
  const mine = jobsFor(cleaner.id, date, jobs);
  if (mine.length) {
    const detail = mine.map((j) => (j.window ? `${j.customer} ${j.window}` : j.customer)).join(", ");
    return { kind: "busy", detail, jobs: mine };
  }
  if (!worksOn(cleaner, day)) return { kind: "off", detail: `off ${DAY_PLURAL[day]}` };
  return { kind: "free", detail: `free ${DAY_SHORT[day]}` };
}

/** Sort key for the cleaner picker: free first, then already-booked, then off. */
export const STATUS_ORDER: Record<CleanerDayStatus["kind"], number> = { free: 0, busy: 1, off: 2 };
