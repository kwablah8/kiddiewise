/**
 * Score-band business logic shared by any component that renders a performance label
 * (06-UI §11 "never color alone" — every band pairs a tone with a real text label).
 */

export type PerformanceTone = "success" | "warning" | "danger" | "neutral";

/** Score bands -> a real label + tone, never color alone (06-UI §11). */
export function performanceBand(score: number | null): { label: string; tone: PerformanceTone } {
  if (score === null) return { label: "No data", tone: "neutral" };
  if (score >= 80) return { label: "Excellent", tone: "success" };
  if (score >= 70) return { label: "Good", tone: "success" };
  if (score >= 60) return { label: "Average", tone: "warning" };
  return { label: "Needs Attention", tone: "danger" };
}
