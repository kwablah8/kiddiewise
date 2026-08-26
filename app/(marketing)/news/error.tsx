"use client";

import { useEffect } from "react";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";

/**
 * The News section's error boundary.
 *
 * Reaching this is unlikely by construction: `getNewsPosts()` catches its own failures and returns an
 * empty list, which renders the designed empty state instead. What this catches is the rest, a
 * rendering fault in a post's rich text, or a Portable Text block shaped in a way the renderer cannot
 * handle. Without it, the marketing site's default error page would show a visitor a stack trace.
 *
 * No error detail is shown to the reader: a parent cannot act on it, and it may name internals. The
 * real cause goes to the server log.
 */
export default function NewsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[marketing/news] render failed:", error);
  }, [error]);

  return (
    <Section
      tone="brand"
      aria-labelledby="news-error-title"
      className="overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36"
    >
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
          News
        </span>
        <h1
          id="news-error-title"
          className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-balance text-white"
        >
          We couldn&apos;t load the news just now.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white">
          Please try again in a moment. If you were looking for term dates or upcoming events, call
          or email us and we will tell you directly.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--m-accent)] px-6 text-[0.95rem] font-medium whitespace-nowrap text-[var(--m-accent-ink)] shadow-sm outline-none transition-[background-color,box-shadow,transform] duration-200 select-none hover:bg-[color-mix(in_srgb,var(--m-accent),black_8%)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--m-accent-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 sm:text-base"
          >
            Try again
          </button>
          <CtaButton href="/contact" variant="ghost-light" size="lg">
            Get in touch
          </CtaButton>
        </div>
      </div>
    </Section>
  );
}
