import { describe, expect, it } from "vitest";
import { describePromotion, hasWork, summarizeDecisions } from "@/lib/promotion";

describe("summarizeDecisions", () => {
  it("counts each outcome", () => {
    expect(
      summarizeDecisions([
        { decision: "promote" },
        { decision: "promote" },
        { decision: "repeat" },
        { decision: "graduate" },
        { decision: "skip" },
      ]),
    ).toEqual({ promoted: 2, repeated: 1, graduated: 1, skipped: 1 });
  });

  it("handles an empty class", () => {
    expect(summarizeDecisions([])).toEqual({
      promoted: 0,
      repeated: 0,
      graduated: 0,
      skipped: 0,
    });
  });
});

describe("describePromotion", () => {
  // The dialog and the success toast both use this, so what an admin is promised and what they are
  // told happened cannot drift apart.
  it("spells out every non-zero outcome", () => {
    expect(
      describePromotion({ promoted: 12, repeated: 2, graduated: 0, skipped: 1 }, "JHS 2", "2026/2027"),
    ).toBe("12 promoted to JHS 2, 2 repeating the same class and 1 left as they are, for 2026/2027.");
  });

  it("omits outcomes that are not happening", () => {
    expect(describePromotion({ promoted: 5, repeated: 0, graduated: 0, skipped: 0 }, "Basic 4", "2026/2027")).toBe(
      "5 promoted to Basic 4, for 2026/2027.",
    );
  });

  it("joins exactly two outcomes with 'and', not a comma", () => {
    expect(describePromotion({ promoted: 3, repeated: 0, graduated: 1, skipped: 0 }, "JHS 3", "2026/2027")).toBe(
      "3 promoted to JHS 3 and 1 graduating, for 2026/2027.",
    );
  });

  it("says so plainly when nothing would happen", () => {
    expect(describePromotion({ promoted: 0, repeated: 0, graduated: 0, skipped: 0 }, "X", "Y")).toBe(
      "Nothing to do.",
    );
  });
});

describe("hasWork", () => {
  it("is false when every student is skipped", () => {
    // Skipping everyone writes nothing, so the confirm button must stay disabled rather than
    // opening a dialog that promises no change.
    expect(hasWork({ promoted: 0, repeated: 0, graduated: 0, skipped: 9 })).toBe(false);
  });

  it("is true as soon as one student is graduating", () => {
    expect(hasWork({ promoted: 0, repeated: 0, graduated: 1, skipped: 9 })).toBe(true);
  });
});
