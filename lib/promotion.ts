import type { PromotionDecision, PromotionResultVM } from "@/lib/validators/promotion";

/**
 * Pure promotion rules, shared by the confirmation dialog and the server action.
 *
 * The dialog has to tell the admin exactly what is about to happen BEFORE they commit — "12
 * promoted to JHS 2, 2 repeating, 1 graduating" — and the action reports what did happen after.
 * Those two sentences must agree, so both count with the same function rather than each doing its
 * own arithmetic.
 */

export function summarizeDecisions(
  decisions: { decision: PromotionDecision }[],
): PromotionResultVM {
  const summary: PromotionResultVM = { promoted: 0, repeated: 0, graduated: 0, skipped: 0 };
  for (const { decision } of decisions) {
    if (decision === "promote") summary.promoted += 1;
    else if (decision === "repeat") summary.repeated += 1;
    else if (decision === "graduate") summary.graduated += 1;
    else summary.skipped += 1;
  }
  return summary;
}

/**
 * The sentence shown in the confirmation dialog and the success toast.
 *
 * Spells out every non-zero outcome rather than saying "15 students processed": promotion is the
 * one action in this app that is awkward to undo by hand, and an admin should be able to read back
 * exactly what they are about to do to which children.
 */
export function describePromotion(
  summary: PromotionResultVM,
  targetClassName: string,
  targetYearName: string,
): string {
  const parts: string[] = [];
  if (summary.promoted > 0) {
    parts.push(`${summary.promoted} promoted to ${targetClassName}`);
  }
  if (summary.repeated > 0) {
    parts.push(`${summary.repeated} repeating the same class`);
  }
  if (summary.graduated > 0) {
    parts.push(`${summary.graduated} graduating`);
  }
  if (summary.skipped > 0) {
    parts.push(`${summary.skipped} left as they are`);
  }
  if (parts.length === 0) return "Nothing to do.";

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${list}, for ${targetYearName}.`;
}

/** Whether the run would write anything at all — drives the confirm button's disabled state. */
export function hasWork(summary: PromotionResultVM): boolean {
  return summary.promoted + summary.repeated + summary.graduated > 0;
}
