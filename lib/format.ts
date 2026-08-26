/**
 * Formatting helpers shared by every data component (06-UI §9).
 * Currency, dates, percentages, and trend copy are formatted in exactly one place.
 */

const ghsFormatter = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

const ghsCompactFormatter = new Intl.NumberFormat("en-GH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * `12, 500.00`, the bare figure, for the rare surface that prints its own currency mark. The
 * school's receipt form has a pre-printed "GHc" field, so a second "GHS" on the line would read as
 * a correction of it.
 */
export function formatAmount(value: number): string {
  return ghsFormatter.format(value);
}

/** `GHS 12, 500.00` */
export function formatGHS(value: number): string {
  return `GHS ${formatAmount(value)}`;
}

/** `21 Jul 2026` */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

/** `94%` (integer, sensible for attendance/scores) */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** `GHS 22K`, compact axis-label form of `formatGHS` for chart ticks. */
export function formatGHSCompact(value: number): string {
  return `GHS ${ghsCompactFormatter.format(value)}`;
}

/** `"2026-01"` -> `"Jan"`, month-point labels for trend chart axes. */
export function formatMonthShort(value: string): string {
  return monthFormatter.format(new Date(value));
}

/** `+12% from last month` / `-8% from last month` */
export function formatTrend(value: number, period = "from last month"): string {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? "+" : "";
  return `${sign}${rounded}% ${period}`;
}

/** `school_admin` -> `School Admin` */
export function formatRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** `Ama Mensah` -> `AM` */
export function formatInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
