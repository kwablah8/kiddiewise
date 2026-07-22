import Image from "next/image";

import { CtaButton } from "@/components/marketing/cta-button";
import { SITE } from "@/lib/marketing/site";
import { MEDIA } from "@/lib/marketing/media";

/**
 * Home hero — a real SLIS community photo (staff & families in the school's blue-and-gold polos)
 * under a deep-blue brand gradient for legibility. The dark top satisfies the shell header's
 * "translucent over a dark hero" contract. Eyebrow carries the motto; a gold pill announces the
 * open admission; dual CTAs drive the two real actions (apply / visit).
 *
 * `.hero-parallax` gives the photo a few percent of scroll-linked drift + a faint scale (CSS
 * `view()` timeline — see `globals.css`); `.accent-pulse` gives the "admission open" dot a slow,
 * quiet pulse. Both are progressive enhancement: fully static without support or under
 * reduced motion, and the foreground text/CTAs are never transformed, so they stay crisp.
 */
export function HomeHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[92svh] items-center overflow-hidden px-6 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28"
    >
      <Image
        src={MEDIA.community.src}
        alt={MEDIA.community.alt}
        fill
        priority
        sizes="100vw"
        className="hero-parallax -z-20 object-cover object-center"
      />
      {/* Deep-blue brand wash: darker at the left/bottom where the text sits, for AA legibility. */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,color-mix(in_srgb,var(--m-brand-deep),transparent_8%)_0%,color-mix(in_srgb,var(--m-brand-deep),transparent_28%)_45%,color-mix(in_srgb,var(--m-brand),transparent_45%)_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="max-w-2xl reveal text-white">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-accent)] sm:text-xs">
            {SITE.motto}
          </span>

          <h1
            id="hero-title"
            className="mt-5 text-[clamp(2.6rem,6vw,4.75rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-balance"
          >
            A place to be nurtured, to grow, and to lead.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white sm:text-xl">
            {SITE.name} guides children from Creche through Junior High School in{" "}
            {SITE.location.lines[0]} — with warmth, structure, and a genuinely high bar for every
            learner.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <CtaButton href="/admissions" variant="gold" size="lg" withArrow>
              Apply for admission
            </CtaButton>
            <CtaButton href="/contact" variant="ghost-light" size="lg">
              Book a visit
            </CtaButton>
          </div>

          <p className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <span
              className="accent-pulse size-2 rounded-full bg-[var(--m-accent)]"
              aria-hidden="true"
            />
            {SITE.admissionsNote}
          </p>
        </div>
      </div>
    </section>
  );
}
