import { describe, expect, it, vi } from "vitest";
import { readAllPaged } from "@/lib/data/_client";

const page = (rows: number[]) => (from: number, to: number) =>
  Promise.resolve({ data: rows.slice(from, to + 1), error: null });

describe("readAllPaged", () => {
  it("keeps reading until a short page, so nothing past the first page is lost", async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => i);
    expect(await readAllPaged(page(rows), "rows")).toEqual(rows);
  });

  it("an exact multiple of the page size costs one extra, empty read", async () => {
    const make = vi.fn(page(Array.from({ length: 10 }, (_, i) => i)));
    await readAllPaged(make, "rows", 5);
    expect(make).toHaveBeenCalledTimes(3);
  });

  it("names what it was reading when a page fails", async () => {
    const make = () => Promise.resolve({ data: null, error: { message: "boom" } });
    await expect(readAllPaged(make, "results")).rejects.toThrow("results: boom");
  });
});
