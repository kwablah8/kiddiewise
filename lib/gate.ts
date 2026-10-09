/**
 * The rules for scans from the gate device.
 *
 * The device's clock knows no timezone: it reports wall-clock time ("2026-10-08 07:42:10") as the
 * school sees it. These helpers turn that into an instant and back, and decide from a day's scans
 * when a person arrived, whether they were late, and when they left. Pure, so the ingest route, the
 * seed and the tests share one reading of the school's times.
 */

export interface GateTimes {
  /** "HH:MM:SS". An arrival after this is late. */
  late_after: string;
  /** "HH:MM:SS". A scan at or after this is a departure. */
  leaving_from: string;
}

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/;

/** Whether `value` is a device wall-clock time, "YYYY-MM-DD HH:MM:SS" (or with a "T"). */
export function isWallTime(value: string): boolean {
  return WALL_TIME.test(value);
}

/** The zone's offset from UTC, in ms, at a given instant. */
function offsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** A wall-clock time in `timeZone` as the instant it names. */
export function wallTimeToInstant(wall: string, timeZone: string): Date {
  const m = WALL_TIME.exec(wall);
  if (!m) throw new Error(`Not a wall-clock time: ${wall}`);
  const [, y, mo, d, h, mi, s] = m.map(Number) as [number, number, number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  // The offset is read at a guess and then once more at the corrected instant, which settles it on
  // either side of a daylight-saving change. Ghana has none, but the school's zone is a setting.
  const first = asUtc - offsetMs(asUtc, timeZone);
  return new Date(asUtc - offsetMs(first, timeZone));
}

/** An instant as the school sees it: its date and "HH:MM:SS". */
export function localParts(instant: Date, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

/** "09:00" or "09:00:00" → "09:00:00", so times compare as strings. */
export function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export interface DayScan {
  at: Date;
  /** Local "HH:MM:SS". */
  time: string;
}

export interface DaySummary {
  arrival: { at: Date; late: boolean } | null;
  departure: { at: Date } | null;
}

/**
 * One person's day from their scans: the first scan before the leaving time is the arrival (late if
 * after the cut-off), the first at or after it the departure. Later scans change nothing, so a child
 * who scans twice is told about once.
 */
export function summarizeDay(scans: readonly DayScan[], times: GateTimes): DaySummary {
  const lateAfter = normalizeTime(times.late_after);
  const leavingFrom = normalizeTime(times.leaving_from);
  const ordered = [...scans].sort((a, b) => a.at.getTime() - b.at.getTime());

  const arrival = ordered.find((s) => s.time < leavingFrom);
  const departure = ordered.find((s) => s.time >= leavingFrom);

  return {
    arrival: arrival ? { at: arrival.at, late: arrival.time > lateAfter } : null,
    departure: departure ? { at: departure.at } : null,
  };
}
