"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  FADE_MS,
  TICK_MS,
  finishRouteProgress,
  getRouteProgressState,
  setRouteProgressCreep,
  startRouteProgress,
  subscribeRouteProgress,
} from "@/lib/route-progress";
import { cn } from "@/lib/utils";

/**
 * The thin progress bar across the top of every screen while a route transition is in flight.
 *
 * Mounted once in the root layout, so one bar serves the marketing site, the auth screens and all
 * three portals. All of the timing lives in `lib/route-progress.ts`; this file is the three ways a
 * navigation announces itself, the one way it announces it finished, and the markup.
 *
 * why the listener-and-store arrangement rather than `useLinkStatus`: see the note at the top of
 * `lib/route-progress.ts`. In short, half of this app navigates from table row clicks, which are
 * not anchors at all.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);
  const { phase, value } = useSyncExternalStore(
    subscribeRouteProgress,
    getRouteProgressState,
    getRouteProgressState,
  );

  // 1. Anchor clicks, every `<Link>` in the app, without touching a single one of them.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Let the browser, not us, handle new-tab/window and non-primary clicks.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // leaving the app entirely
      // Same-page links: the active sidebar item, an in-page `#anchor`. Neither transitions, so a
      // bar for them would appear and be cancelled with nothing in between.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      startRouteProgress();
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // 2. Back / forward. `router.back()` lands here too, which is why `lib/navigation.ts` leaves
  //    those two methods alone.
  useEffect(() => {
    const onPopState = () => startRouteProgress();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // 3. Programmatic pushes come straight into the store from `lib/navigation.ts`.

  // Done. Effects run after the new screen commits, so this is the moment the wait actually ended.
  useEffect(() => {
    finishRouteProgress();
  }, [pathname]);

  // A bar that creeps is animation, so for anyone who asked for less of it we show a still bar
  // instead: parked at the ceiling, no width transition, no fade. Tracked in state rather than left
  // to a `motion-reduce:` class because the transition below is an inline style, which would win.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(query.matches);
      setRouteProgressCreep(!query.matches);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (phase === "idle" || phase === "waiting") return null;

  const finishing = phase === "finishing";

  return (
    // Above the sidebar (z-30) and its mobile overlay, and never in the way of a click.
    <div className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5">
      {/* No aria-valuenow: the creep is a plausible guess, not measured progress, so this is an
          indeterminate progressbar. Route changes are announced by Next's own route announcer, so
          there is deliberately no live region here to talk over it. */}
      <div
        role="progressbar"
        aria-label="Loading page"
        className={cn(
          "h-full rounded-r-full bg-[var(--primary)]",
          finishing && !reducedMotion ? "opacity-0" : "opacity-100",
        )}
        style={{
          width: `${value * 100}%`,
          // A faint bloom in the brand blue, so the leading edge reads as lit rather than clipped.
          boxShadow: "0 0 10px 1px color-mix(in srgb, var(--primary), transparent 40%)",
          // The creep's width transition matches the tick interval, so the steps read as one
          // continuous slide. On finishing, the fill snaps shut and the fade trails it out.
          transition: reducedMotion
            ? "none"
            : finishing
              ? `width 120ms ease-out, opacity ${FADE_MS - 100}ms ease-in 100ms`
              : `width ${TICK_MS}ms linear`,
        }}
      />
    </div>
  );
}
