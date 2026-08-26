import type { Metadata } from "next";
import { NotFoundActions } from "@/components/states/not-found-actions";
import { NotFoundIllustration } from "@/components/states/not-found-illustration";

export const metadata: Metadata = {
  title: "Page not found · SLIS Portal",
};

/**
 * Global 404 (06-UI §7 "Error"). Renders on the light content canvas rather than the app shell,
 * since an unmatched top-level route resolves against the root layout. The hero is a bespoke,
 * on-brand illustration, a record search that finds nothing, carrying the app's SLIS navy + blue
 * tokens (06-UI §2) instead of a generic graphic.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-6 py-16">
      <div className="w-full max-w-md text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <div className="flex justify-center">
          <NotFoundIllustration className="h-auto w-56 max-w-full" />
        </div>

        <p className="mt-6 text-xs font-medium tracking-[0.18em] text-[var(--label)] uppercase">
          Error 404
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--text)]">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
          The link may be broken, or the page may have moved. Check the address, or head back to
          your dashboard.
        </p>

        <NotFoundActions />
      </div>
    </main>
  );
}
