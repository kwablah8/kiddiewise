import { describe, expect, it } from "vitest";
import { combineFeeTotals, summarizeFees } from "@/lib/fees/summary";

describe("summarizeFees", () => {
  it("aggregates totals, collection rate and the paid/partial/pending breakdown", () => {
    const s = summarizeFees(
      [
        { expected: 1000, paid: 1000, arrears: 0 }, // fully paid
        { expected: 1000, paid: 400, arrears: 0 }, // partial
        { expected: 1000, paid: 0, arrears: 200 }, // pending, carries arrears
        { expected: 1000, paid: 1200, arrears: 200 }, // fully paid incl. arrears
      ],
      [
        { amount: 300, paid: 300 },
        { amount: 500, paid: 100 },
      ],
    );
    expect(s.total_expected).toBe(4000);
    expect(s.total_paid).toBe(2600);
    expect(s.total_arrears).toBe(400);
    expect(s.outstanding).toBe(1800); // 4000 + 400 - 2600
    expect(s.collection_rate).toBe(59); // 2600 / 4400 → 59%
    expect(s.fully_paid).toBe(2);
    expect(s.partial).toBe(1);
    expect(s.pending).toBe(1);
    expect(s.total_records).toBe(4);
    expect(s.extra_total).toBe(800);
    expect(s.extra_paid).toBe(400);
    expect(s.extra_balance).toBe(400);
    expect(s.extra_records).toBe(2);
  });

  it("returns zeroes (rate 0, no divide-by-zero) for no records", () => {
    const s = summarizeFees([], []);
    expect(s.total_expected).toBe(0);
    expect(s.collection_rate).toBe(0);
    expect(s.outstanding).toBe(0);
    expect(s.total_records).toBe(0);
  });
});

describe("combineFeeTotals", () => {
  it("folds class fees and extra fees into the one figure a parent owes", () => {
    const totals = combineFeeTotals(
      summarizeFees(
        [{ expected: 1000, paid: 400, arrears: 200 }],
        [{ amount: 300, paid: 0 }],
      ),
    );
    expect(totals.due).toBe(1500); // 1000 expected + 200 arrears + 300 extra
    expect(totals.paid).toBe(400);
    expect(totals.outstanding).toBe(1100); // 800 on the invoice + 300 on the extra fee
  });

  it("does not let an overpaid invoice settle a separate extra fee", () => {
    // The regression this guards: computing `due - paid` would report GHS 0 outstanding here and
    // tell a parent the uniform is paid for, while the school's ledger still shows it unpaid.
    const totals = combineFeeTotals(
      summarizeFees([{ expected: 1000, paid: 1300, arrears: 0 }], [{ amount: 300, paid: 0 }]),
    );
    expect(totals.due).toBe(1300);
    expect(totals.paid).toBe(1300);
    expect(totals.outstanding).toBe(300);
  });

  it("is zero across the board for a child with no fees on record", () => {
    expect(combineFeeTotals(summarizeFees([], []))).toEqual({ due: 0, paid: 0, outstanding: 0 });
  });
});
