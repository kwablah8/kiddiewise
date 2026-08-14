/**
 * Route-transition progress — the store behind `components/app/route-progress-bar.tsx`.
 *
 * Framework-free on purpose. The bar is a single instance mounted in the root layout, so its
 * timers and its easing curve have no business living in a component: keeping them here makes the
 * whole behaviour unit-testable without rendering anything (`tests/unit/route-progress.test.ts`),
 * and leaves the component to do nothing but subscribe and draw.
 *
 * Why a store instead of Next's `useLinkStatus`: that hook reports the pending state of ONE
 * `<Link>`, and most navigations in this app are programmatic — a data-table row click pushing
 * `/students/:id`, a form redirecting back to its list. Those are the slowest transitions here, so
 * the indicator cannot be link-bound. `lib/navigation.ts` feeds them in instead.
 */

/** The creep approaches this fraction but never arrives; 1 is reserved for "the route committed". */
export const CREEP_CEILING = 0.9;
/** Where the bar starts once it paints — visible at once, without claiming real progress. */
export const CREEP_START = 0.08;
/** Share of the remaining distance each tick covers, so the steps decelerate on their own. */
const CREEP_RATE = 0.22;

/** ms a navigation may take before the bar paints, so a cached route never flashes one. */
export const GRACE_MS = 150;
/** ms between creep steps. */
export const TICK_MS = 220;
/** ms the filled bar lingers while it fades out. */
export const FADE_MS = 220;
/** ms after which a navigation is presumed dead, so the bar can never stick at the ceiling. */
export const SAFETY_MS = 15_000;

export type RouteProgressPhase =
  /** Nothing in flight; the bar is not rendered. */
  | "idle"
  /** A navigation started but is still inside the grace window; the bar is not rendered yet. */
  | "waiting"
  /** Painted and creeping towards the ceiling. */
  | "running"
  /** Filled to 1 and fading out. */
  | "finishing";

export interface RouteProgressState {
  phase: RouteProgressPhase;
  /** 0–1. Only meaningful while the phase is "running" or "finishing". */
  value: number;
}

/**
 * The next creep value: decelerating, and clamped so it can only approach the ceiling. A bar that
 * slows as it goes reads as "still working" for an unknown wait, which is exactly what a route
 * transition is — we never know how much of it is left.
 */
export function nextProgress(current: number): number {
  const from = Math.min(Math.max(current, 0), CREEP_CEILING);
  return from + (CREEP_CEILING - from) * CREEP_RATE;
}

const IDLE: RouteProgressState = { phase: "idle", value: 0 };

type Listener = () => void;

let state: RouteProgressState = IDLE;
const listeners = new Set<Listener>();
let creepEnabled = true;

let graceTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers(): void {
  if (graceTimer) clearTimeout(graceTimer);
  if (tickTimer) clearInterval(tickTimer);
  if (fadeTimer) clearTimeout(fadeTimer);
  if (safetyTimer) clearTimeout(safetyTimer);
  graceTimer = tickTimer = fadeTimer = safetyTimer = null;
}

/** Swap in a new state object — never mutate, so `useSyncExternalStore` sees the change. */
function publish(next: RouteProgressState): void {
  state = next;
  for (const listener of [...listeners]) listener();
}

/** Stable snapshot for `useSyncExternalStore`; identity only changes when the state does. */
export function getRouteProgressState(): RouteProgressState {
  return state;
}

export function subscribeRouteProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Turn the creep off for visitors who asked to reduce motion: the bar then appears at the ceiling
 * and disappears, saying "loading" without animating anything. Driven from the component's mount
 * effect — `matchMedia` is a browser concern and stays out of this module.
 */
export function setRouteProgressCreep(enabled: boolean): void {
  creepEnabled = enabled;
  if (enabled) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  if (state.phase === "running") publish({ phase: "running", value: CREEP_CEILING });
}

function paint(): void {
  graceTimer = null;
  publish({ phase: "running", value: creepEnabled ? CREEP_START : CREEP_CEILING });
  if (!creepEnabled) return;
  tickTimer = setInterval(() => {
    publish({ phase: "running", value: nextProgress(state.value) });
  }, TICK_MS);
}

/** A navigation has begun. Repeat calls while one is already in flight are ignored. */
export function startRouteProgress(): void {
  if (state.phase === "waiting" || state.phase === "running") return;
  clearTimers();
  publish({ phase: "waiting", value: 0 });
  graceTimer = setTimeout(paint, GRACE_MS);
  safetyTimer = setTimeout(finishRouteProgress, SAFETY_MS);
}

/** The route committed (or the safety timeout fired). Fills the bar, fades it, resets. */
export function finishRouteProgress(): void {
  if (state.phase === "idle" || state.phase === "finishing") return;
  const painted = state.phase === "running";
  clearTimers();
  // A navigation that resolved inside the grace window never painted, so there is nothing to fade
  // out — going straight back to idle is what keeps a fast, cached transition silent.
  if (!painted) {
    publish(IDLE);
    return;
  }
  publish({ phase: "finishing", value: 1 });
  fadeTimer = setTimeout(() => {
    fadeTimer = null;
    publish(IDLE);
  }, FADE_MS);
}

/** Drop every timer and go idle. For tests, and for the component's unmount cleanup. */
export function resetRouteProgress(): void {
  clearTimers();
  creepEnabled = true;
  publish(IDLE);
}
