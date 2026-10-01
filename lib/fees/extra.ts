import { FEE_TERM_LABEL, type ExtraFeeFrequency, type FeeTerm } from "@/lib/validators/fees";

/**
 * Billing periods for extra-fee charges.
 *
 * A charge bills one period of the academic year, and the fee's frequency decides which kind:
 * a termly fee bills a term, a monthly fee bills a month, and annual and one-time fees bill the
 * year. Nothing is raised automatically; charging the next term or month is another assignment.
 */

export interface ChargePeriod {
  fee_term: FeeTerm;
  /** First day of the billed month ("2026-10-01"), monthly fees only. */
  billing_month: string | null;
}

const TERM_BY_ORDINAL: Record<number, FeeTerm> = { 1: "first", 2: "second", 3: "third" };

/** "2026-10" or "2026-10-01" → "2026-10". */
const monthKey = (date: string) => date.slice(0, 7);

/**
 * Check a requested period against the fee's frequency and the academic year it falls in, and
 * return it in its stored shape. Fields that do not apply to the frequency are dropped rather than
 * rejected, so a form that keeps a stale term selection around cannot mis-file a monthly charge.
 */
export function resolveChargePeriod(
  frequency: ExtraFeeFrequency,
  requested: { fee_term: FeeTerm; billing_month: string | null },
  year: { start_date: string; end_date: string },
): { ok: true; period: ChargePeriod } | { ok: false; message: string } {
  if (frequency === "termly") {
    if (requested.fee_term === "full_year") {
      return { ok: false, message: "Choose which term this charge is for." };
    }
    return { ok: true, period: { fee_term: requested.fee_term, billing_month: null } };
  }

  if (frequency === "monthly") {
    if (!requested.billing_month) {
      return { ok: false, message: "Choose which month this charge is for." };
    }
    const month = monthKey(requested.billing_month);
    // Compared as "YYYY-MM" strings, which order the same way the months do.
    if (month < monthKey(year.start_date) || month > monthKey(year.end_date)) {
      return { ok: false, message: "That month is outside the active academic year." };
    }
    return { ok: true, period: { fee_term: "full_year", billing_month: `${month}-01` } };
  }

  return { ok: true, period: { fee_term: "full_year", billing_month: null } };
}

/** The period a new charge form starts on: the active term, or this month. */
export function defaultChargePeriod(
  frequency: ExtraFeeFrequency,
  activeTermOrdinal: number | null,
  today: Date,
): { fee_term: FeeTerm; billing_month: string | null } {
  if (frequency === "termly") {
    return { fee_term: TERM_BY_ORDINAL[activeTermOrdinal ?? 1] ?? "first", billing_month: null };
  }
  if (frequency === "monthly") {
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return { fee_term: "full_year", billing_month: `${today.getFullYear()}-${month}` };
  }
  return { fee_term: "full_year", billing_month: null };
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "First Term", "Full Year", or "October 2026" for a monthly charge. */
export function chargePeriodLabel(period: ChargePeriod): string {
  if (period.billing_month) {
    return MONTH_LABEL.format(new Date(`${monthKey(period.billing_month)}-01T00:00:00Z`));
  }
  return FEE_TERM_LABEL[period.fee_term];
}
