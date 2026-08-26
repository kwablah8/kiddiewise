import { Section } from "@/components/marketing/section";

/**
 * Shown while a news read is in flight.
 *
 * This is a narrow window by design: posts are cached for 60 seconds, so a visitor only sees it if
 * they are the first to arrive after the cache expires. It exists because rule 4 asks for all four
 * states, and because the alternative on a slow Ghanaian mobile connection is a blank white page.
 *
 * The blue hero block is not a skeleton: it is the real hero geometry, so the translucent site header
 * reads correctly against a dark band from the first paint and does not flash light-on-light.
 */
export default function NewsLoading() {
  return (
    <>
      <Section
        tone="brand"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
        aria-hidden="true"
      >
        <div className="max-w-2xl">
          <div className="h-7 w-24 rounded-full bg-white/15" />
          <div className="mt-6 space-y-3">
            <div className="h-11 w-full rounded-lg bg-white/15" />
            <div className="h-11 w-4/5 rounded-lg bg-white/15" />
          </div>
          <div className="mt-6 h-6 w-64 rounded bg-white/10" />
        </div>
      </Section>

      <Section tone="white">
        <p className="sr-only" role="status">
          Loading news posts…
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--m-canvas)]"
            >
              <div className="aspect-[16/10] animate-pulse bg-[var(--m-warm)] motion-reduce:animate-none" />
              <div className="space-y-3 p-7">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--m-warm)] motion-reduce:animate-none" />
                <div className="h-6 w-4/5 animate-pulse rounded bg-[var(--m-warm)] motion-reduce:animate-none" />
                <div className="h-4 w-full animate-pulse rounded bg-[var(--m-warm)] motion-reduce:animate-none" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--m-warm)] motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
