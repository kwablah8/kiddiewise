export type MockState = "success" | "empty" | "error" | "loading";

export function currentMockState(): MockState {
  if (typeof window !== "undefined") {
    const s = new URLSearchParams(window.location.search).get("mockState");
    if (s === "empty" || s === "error" || s === "loading") return s;
  }
  return (process.env.NEXT_PUBLIC_MOCK_STATE as MockState) ?? "success";
}

export async function simulate<T>(value: T, emptyValue: T): Promise<T> {
  const state = currentMockState();
  if (state === "error") throw new Error("Simulated data error");
  if (state === "loading") await new Promise(() => {}); // hang → skeleton stays
  await new Promise((r) => setTimeout(r, 400)); // realistic latency
  return state === "empty" ? emptyValue : value;
}
