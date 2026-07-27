import { describe, expect, it } from "vitest";
import { matchesQuery } from "@/lib/search";

describe("matchesQuery", () => {
  it("matches everything when nothing is typed", () => {
    expect(matchesQuery("", "Ama", "Mensah")).toBe(true);
    expect(matchesQuery("   ", "Ama", "Mensah")).toBe(true);
  });

  it("ignores case", () => {
    expect(matchesQuery("AMA", "Ama Mensah")).toBe(true);
    expect(matchesQuery("mensah", "Ama Mensah")).toBe(true);
  });

  it("matches a partial word", () => {
    expect(matchesQuery("men", "Ama Mensah")).toBe(true);
  });

  it("requires every term, in any field and any order", () => {
    // Half-remembered names are what people actually type.
    expect(matchesQuery("ama men", "Ama", "Mensah")).toBe(true);
    expect(matchesQuery("mensah ama", "Ama", "Mensah")).toBe(true);
    expect(matchesQuery("ama kofi", "Ama", "Mensah")).toBe(false);
  });

  it("searches across separate fields", () => {
    expect(matchesQuery("TCH-2", "Kwabena", "Adjei", "TCH-2")).toBe(true);
  });

  it("skips nulls rather than stringifying them", () => {
    // An empty phone column must never match a search for "null".
    expect(matchesQuery("null", "Ama", null, undefined)).toBe(false);
  });

  it("searches numbers", () => {
    expect(matchesQuery("450", "School fees", 4500)).toBe(true);
  });
});
