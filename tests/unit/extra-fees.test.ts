import { describe, expect, it } from "vitest";
import { chargePeriodLabel, defaultChargePeriod, resolveChargePeriod } from "@/lib/fees/extra";

const year = { start_date: "2026-08-02", end_date: "2027-07-30" };

describe("resolveChargePeriod", () => {
  it("bills a termly fee for the chosen term", () => {
    expect(resolveChargePeriod("termly", { fee_term: "second", billing_month: null }, year)).toEqual({
      ok: true,
      period: { fee_term: "second", billing_month: null },
    });
  });

  it("refuses a termly fee without a term", () => {
    const r = resolveChargePeriod("termly", { fee_term: "full_year", billing_month: null }, year);
    expect(r.ok).toBe(false);
  });

  it("bills a monthly fee for the first of the chosen month, as a year-level charge", () => {
    expect(resolveChargePeriod("monthly", { fee_term: "first", billing_month: "2026-10" }, year)).toEqual({
      ok: true,
      period: { fee_term: "full_year", billing_month: "2026-10-01" },
    });
  });

  it("accepts the months the academic year starts and ends in", () => {
    expect(resolveChargePeriod("monthly", { fee_term: "full_year", billing_month: "2026-08" }, year).ok).toBe(true);
    expect(resolveChargePeriod("monthly", { fee_term: "full_year", billing_month: "2027-07" }, year).ok).toBe(true);
  });

  it("refuses a month outside the academic year, or no month at all", () => {
    expect(resolveChargePeriod("monthly", { fee_term: "full_year", billing_month: "2026-07" }, year).ok).toBe(false);
    expect(resolveChargePeriod("monthly", { fee_term: "full_year", billing_month: "2027-08" }, year).ok).toBe(false);
    expect(resolveChargePeriod("monthly", { fee_term: "full_year", billing_month: null }, year).ok).toBe(false);
  });

  it("bills annual and one-time fees for the whole year, ignoring a stray term or month", () => {
    for (const frequency of ["annual", "one_time"] as const) {
      expect(resolveChargePeriod(frequency, { fee_term: "third", billing_month: "2026-10" }, year)).toEqual({
        ok: true,
        period: { fee_term: "full_year", billing_month: null },
      });
    }
  });
});

describe("defaultChargePeriod", () => {
  const today = new Date(2026, 9, 14); // 14 October 2026

  it("starts a termly fee on the active term, falling back to the first", () => {
    expect(defaultChargePeriod("termly", 2, today).fee_term).toBe("second");
    expect(defaultChargePeriod("termly", null, today).fee_term).toBe("first");
  });

  it("starts a monthly fee on this month", () => {
    expect(defaultChargePeriod("monthly", 1, today)).toEqual({ fee_term: "full_year", billing_month: "2026-10" });
  });
});

describe("chargePeriodLabel", () => {
  it("names a month for monthly charges and the term otherwise", () => {
    expect(chargePeriodLabel({ fee_term: "full_year", billing_month: "2026-10-01" })).toBe("October 2026");
    expect(chargePeriodLabel({ fee_term: "first", billing_month: null })).toBe("First Term");
    expect(chargePeriodLabel({ fee_term: "full_year", billing_month: null })).toBe("Full Year");
  });
});
