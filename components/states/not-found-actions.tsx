"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Client half of the 404 screen (app/not-found.tsx stays a server component so it can export
 * metadata). Surfaces the requested path — honest + orienting, and a genuine help while many
 * section routes are still being built — and a "Go back" affordance alongside the dashboard link.
 */
export function NotFoundActions() {
  const router = useRouter();
  const pathname = usePathname();
  const showPath = !!pathname && pathname !== "/";

  return (
    <>
      {showPath && (
        <div className="mt-6 flex justify-center">
          <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 pr-3 pl-2.5">
            <span className="shrink-0 text-[11px] font-medium tracking-wider text-[var(--label)] uppercase">
              Requested
            </span>
            <code className="truncate font-mono text-xs text-[var(--muted-foreground)]">
              {pathname}
            </code>
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className={cn(buttonVariants(), "h-9 w-full gap-1.5 px-4 sm:w-auto")}
        >
          <LayoutDashboard aria-hidden="true" />
          Back to dashboard
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-9 w-full gap-1.5 px-4 sm:w-auto"
        >
          <ArrowLeft aria-hidden="true" />
          Go back
        </Button>
      </div>
    </>
  );
}
