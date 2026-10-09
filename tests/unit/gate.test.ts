import { describe, expect, it } from "vitest";
import { isWallTime, localParts, summarizeDay, wallTimeToInstant } from "@/lib/gate";

describe("wall-clock times", () => {
  it("reads Ghana time as UTC, which it is", () => {
    expect(wallTimeToInstant("2026-10-08 07:42:10", "Africa/Accra").toISOString()).toBe(
      "2026-10-08T07:42:10.000Z",
    );
  });

  it("applies the zone's offset, including across daylight saving", () => {
    expect(wallTimeToInstant("2026-07-01T08:00:00", "Europe/London").toISOString()).toBe(
      "2026-07-01T07:00:00.000Z",
    );
    expect(wallTimeToInstant("2026-01-15T08:00:00", "Europe/London").toISOString()).toBe(
      "2026-01-15T08:00:00.000Z",
    );
    expect(wallTimeToInstant("2026-10-08 07:00:00", "Africa/Lagos").toISOString()).toBe(
      "2026-10-08T06:00:00.000Z",
    );
  });

  it("round-trips through localParts", () => {
    const at = wallTimeToInstant("2026-10-08 23:59:59", "Africa/Lagos");
    expect(localParts(at, "Africa/Lagos")).toEqual({ date: "2026-10-08", time: "23:59:59" });
  });

  it("recognises only full date-times", () => {
    expect(isWallTime("2026-10-08 07:42:10")).toBe(true);
    expect(isWallTime("2026-10-08T07:42:10")).toBe(true);
    expect(isWallTime("2026-10-08")).toBe(false);
    expect(isWallTime("07:42")).toBe(false);
  });
});

describe("summarizeDay", () => {
  const times = { late_after: "09:00:00", leaving_from: "12:00:00" };
  const scan = (time: string) => ({ at: new Date(`2026-10-08T${time}Z`), time });

  it("takes the first morning scan as the arrival, on time up to the cut-off", () => {
    const day = summarizeDay([scan("07:50:00"), scan("07:42:10"), scan("08:30:00")], times);
    expect(day.arrival).toEqual({ at: new Date("2026-10-08T07:42:10Z"), late: false });
    expect(day.departure).toBeNull();
    expect(summarizeDay([scan("09:00:00")], times).arrival?.late).toBe(false);
  });

  it("marks an arrival after the cut-off late", () => {
    expect(summarizeDay([scan("09:00:01")], times).arrival?.late).toBe(true);
  });

  it("takes the first scan from the leaving time as the departure", () => {
    const day = summarizeDay([scan("07:42:10"), scan("15:10:00"), scan("12:00:00")], times);
    expect(day.departure).toEqual({ at: new Date("2026-10-08T12:00:00Z") });
  });

  it("never turns an afternoon-only scan into an arrival", () => {
    const day = summarizeDay([scan("13:00:00")], times);
    expect(day.arrival).toBeNull();
    expect(day.departure).not.toBeNull();
  });

  it("accepts times written without seconds", () => {
    const day = summarizeDay([scan("09:30:00")], { late_after: "10:00", leaving_from: "12:00" });
    expect(day.arrival?.late).toBe(false);
  });
});
