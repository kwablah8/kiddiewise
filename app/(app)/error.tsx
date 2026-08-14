"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the whole authenticated portal.
 *
 * Without an error.tsx here, a render-time throw anywhere in admin/teacher/parent screens takes the
 * entire page down to a blank white screen with no way back — the worst possible outcome for a
 * non-technical school user mid-task. This catches it, shows a plain-language recovery, and keeps the
 * app shell around it. `reset()` re-renders the failed segment (a transient data blip recovers without
 * a full reload); the reload link is the fallback when it doesn't.
 *
 * Deliberately generic copy — `error.message` can carry internals that mean nothing to a user and
 * shouldn't be shown; the digest goes to the server logs for us instead.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portal render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--danger)_10%,white)] text-[var(--danger)]">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-[var(--text)]">Something went wrong</h1>
        <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
          This screen ran into a problem. You can try again, and if it keeps happening, let the school
          office know.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Go to the start
        </Button>
      </div>
    </div>
  );
}
