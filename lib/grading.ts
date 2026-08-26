/**
 * Score-band business logic shared by any component that renders a performance label
 * (06-UI §11 "never color alone", every band pairs a tone with a real text label).
 */

import type { GradeBandVM } from "@/lib/validators/grading";

export type PerformanceTone = "success" | "warning" | "danger" | "neutral";

/** Score bands -> a real label + tone, never color alone (06-UI §11). */
export function performanceBand(score: number | null): { label: string; tone: PerformanceTone } {
  if (score === null) return { label: "No data", tone: "neutral" };
  if (score >= 80) return { label: "Excellent", tone: "success" };
  if (score >= 70) return { label: "Good", tone: "success" };
  if (score >= 60) return { label: "Average", tone: "warning" };
  return { label: "Needs Attention", tone: "danger" };
}

// Map a raw score (out of maxScore) to a grade+remark using the school's percentage-based bands.
//
// The EXACT percentage is tried first, then the rounded one. Both passes are needed because the two
// ways schools write a scale need opposite treatment:
//   - fractional bands (0–34.9, 35–39.9, ... 90–100): 89.9% is a grade 2, and rounding it to 90 would
//     promote a child into the top band they missed;
//   - contiguous integer bands (70–79, 80–100): 79.5% matches nothing at all, and rounding is what
//     closes the gap the school left between the two.
// Returns null if maxScore is non-positive or neither pass finds a band.
export function scoreToGrade(
  score: number,
  maxScore: number,
  bands: GradeBandVM[],
): { grade: string; remark: string } | null {
  if (maxScore <= 0) return null;
  const pct = (score / maxScore) * 100;
  const match = (p: number) => bands.find((b) => p >= b.min_score && p <= b.max_score);
  const band = match(pct) ?? match(Math.round(pct));
  return band ? { grade: band.grade, remark: band.remark } : null;
}

export function assessmentTypeWeightTotal(types: { weight: number }[]): number {
  return types.reduce((sum, t) => sum + t.weight, 0);
}

// Guidance for the grading-scale editor: overlapping bands and incomplete 0–100 coverage. The UI
// shows these as soft warnings; it never blocks on them.
export function gradeBandWarnings(bands: GradeBandVM[]): string[] {
  const warnings: string[] = [];
  const sorted = [...bands].sort((a, b) => a.min_score - b.min_score);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i]!.max_score >= sorted[j]!.min_score) {
        warnings.push(`"${sorted[i]!.grade}" and "${sorted[j]!.grade}" ranges overlap.`);
      }
    }
  }
  if (sorted.length > 0) {
    if (sorted[0]!.min_score > 0) warnings.push("Scores below the lowest band have no grade.");
    if (sorted[sorted.length - 1]!.max_score < 100) {
      warnings.push("Scores above the highest band have no grade.");
    }
  }
  return warnings;
}
