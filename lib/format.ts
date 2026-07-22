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

/** `GHS 12,500.00` */
export function formatGHS(value: number): string {
  return `GHS ${ghsFormatter.format(value)}`;
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
