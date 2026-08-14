import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CREEP_CEILING,
  CREEP_START,
  FADE_MS,
  GRACE_MS,
  SAFETY_MS,
  TICK_MS,
  finishRouteProgress,
  getRouteProgressState,
  nextProgress,
  resetRouteProgress,
  setRouteProgressCreep,
  startRouteProgress,
  subscribeRouteProgress,
} from "@/lib/route-progress";

describe("nextProgress", () => {
  it("decelerates: every step is smaller than the one before it", () => {
    const a = nextProgress(CREEP_START);
    const b = nextProgress(a);
    const c = nextProgress(b);
    expect(a - CREEP_START).toBeGreaterThan(b - a);
    expect(b - a).toBeGreaterThan(c - b);
  });

  it("always advances but never reaches the ceiling within a navigation's lifetime", () => {
    // The safety timeout ends any run, so this is the most ticks the bar can ever creep for.
    const maxTicks = Math.ceil(SAFETY_MS / TICK_MS);
    let value = CREEP_START;
    for (let i = 0; i < maxTicks; i++) {
      const next = nextProgress(value);
      expect(next).toBeGreaterThan(value);
      expect(next).toBeLessThan(CREEP_CEILING);
      value = next;
    }
    // By the safety cut-off it should be pressed right up against the ceiling.
    expect(value).toBeCloseTo(CREEP_CEILING, 5);
  });

  it("clamps input outside 0–ceiling instead of overshooting", () => {
    expect(nextProgress(-1)).toBe(nextProgress(0));
    expect(nextProgress(1)).toBe(CREEP_CEILING);
  });
});

describe("route progress store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRouteProgress();
  });
  afterEach(() => {
    resetRouteProgress();
    vi.useRealTimers();
  });

  it("starts idle", () => {
    expect(getRouteProgressState()).toEqual({ phase: "idle", value: 0 });
  });

  it("holds the bar back during the grace window, then paints it", () => {
    startRouteProgress();
    expect(getRouteProgressState().phase).toBe("waiting");

    vi.advanceTimersByTime(GRACE_MS - 1);
    expect(getRouteProgressState().phase).toBe("waiting");

    vi.advanceTimersByTime(1);
    expect(getRouteProgressState()).toEqual({ phase: "running", value: CREEP_START });
  });

  it("shows nothing at all when a navigation resolves inside the grace window", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS - 20);
    finishRouteProgress();

    // Straight back to idle — no paint, so no one-frame flash on a cached route.
    expect(getRouteProgressState()).toEqual({ phase: "idle", value: 0 });
    vi.advanceTimersByTime(SAFETY_MS);
    expect(getRouteProgressState().phase).toBe("idle");
  });

  it("creeps while the navigation is in flight and never claims to be done", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS);

    let previous = getRouteProgressState().value;
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(TICK_MS);
      const { phase, value } = getRouteProgressState();
      expect(phase).toBe("running");
      expect(value).toBeGreaterThan(previous);
      expect(value).toBeLessThan(CREEP_CEILING);
      previous = value;
    }
  });

  it("fills, fades, then resets when the route commits", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS + TICK_MS);

    finishRouteProgress();
    expect(getRouteProgressState()).toEqual({ phase: "finishing", value: 1 });

    vi.advanceTimersByTime(FADE_MS - 1);
    expect(getRouteProgressState().phase).toBe("finishing");

    vi.advanceTimersByTime(1);
    expect(getRouteProgressState()).toEqual({ phase: "idle", value: 0 });
  });

  it("ignores a second start while one navigation is already in flight", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS + TICK_MS * 3);
    const midway = getRouteProgressState().value;

    startRouteProgress(); // e.g. a redirect fired on top of the click that caused it
    expect(getRouteProgressState().value).toBe(midway);
    expect(getRouteProgressState().phase).toBe("running");
  });

  it("restarts cleanly when a new navigation begins during the fade-out", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS + TICK_MS);
    finishRouteProgress();

    startRouteProgress();
    expect(getRouteProgressState().phase).toBe("waiting");

    // The cancelled fade must not drop the new run back to idle behind our back.
    vi.advanceTimersByTime(GRACE_MS);
    expect(getRouteProgressState()).toEqual({ phase: "running", value: CREEP_START });
  });

  it("gives up on a hung navigation so the bar can never stick", () => {
    startRouteProgress();
    vi.advanceTimersByTime(SAFETY_MS);
    expect(getRouteProgressState().phase).toBe("finishing");

    vi.advanceTimersByTime(FADE_MS);
    expect(getRouteProgressState().phase).toBe("idle");
  });

  it("finishing when nothing is in flight does nothing", () => {
    finishRouteProgress();
    expect(getRouteProgressState()).toEqual({ phase: "idle", value: 0 });
  });

  it("with creep off, sits still at the ceiling and never ticks", () => {
    setRouteProgressCreep(false);
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS);
    expect(getRouteProgressState()).toEqual({ phase: "running", value: CREEP_CEILING });

    vi.advanceTimersByTime(TICK_MS * 10);
    expect(getRouteProgressState().value).toBe(CREEP_CEILING);
  });

  it("turning creep off mid-flight parks the bar at the ceiling", () => {
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS + TICK_MS);
    setRouteProgressCreep(false);
    expect(getRouteProgressState()).toEqual({ phase: "running", value: CREEP_CEILING });

    vi.advanceTimersByTime(TICK_MS * 5);
    expect(getRouteProgressState().value).toBe(CREEP_CEILING);
  });

  it("notifies subscribers on every phase change until they unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeRouteProgress(() => seen.push(getRouteProgressState().phase));

    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS);
    finishRouteProgress();
    vi.advanceTimersByTime(FADE_MS);
    expect(seen).toEqual(["waiting", "running", "finishing", "idle"]);

    unsubscribe();
    startRouteProgress();
    vi.advanceTimersByTime(GRACE_MS);
    expect(seen).toHaveLength(4);
  });

  it("hands out a stable state object so useSyncExternalStore does not loop", () => {
    const first = getRouteProgressState();
    expect(getRouteProgressState()).toBe(first);

    startRouteProgress();
    const waiting = getRouteProgressState();
    expect(getRouteProgressState()).toBe(waiting);
    expect(waiting).not.toBe(first);
  });
});
