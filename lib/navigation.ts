"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { startRouteProgress } from "@/lib/route-progress";

/**
 * `useRouter()` with the route-progress bar wired in. Use this instead of `useRouter` anywhere the
 * app navigates in code.
 *
 * The bar's anchor listener (`components/app/route-progress-bar.tsx`) covers every `<Link>` for
 * free, but a great deal of this app navigates without one: a data-table row click pushing
 * `/students/:id`, a form redirecting to its list once it saves, the role guard bouncing a signed-out
 * visitor to `/login`. Those are the slowest transitions in the portal, a detail page is a fresh
 * chunk and a fresh set of queries, so they are exactly the ones that must not go unindicated.
 *
 * `back`/`forward` are deliberately left as they are: both fire `popstate`, which the bar already
 * listens for, and starting the bar here as well would be a second announcement of one navigation.
 */
export function useAppRouter() {
  const router = useRouter();

  // Memoised against `router` because call sites list the router in effect dependencies, a fresh
  // object every render would re-run those effects forever (the role guard in `app/(app)/layout.tsx`
  // would redirect on a loop).
  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        startRouteProgress();
        router.push(...args);
      },
      replace: (...args: Parameters<typeof router.replace>) => {
        startRouteProgress();
        router.replace(...args);
      },
    }),
    [router],
  );
}
