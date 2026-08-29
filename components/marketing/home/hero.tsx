import { CtaButton } from "@/components/marketing/cta-button";
import { HeroParallaxImage } from "@/components/marketing/home/hero-parallax-image";
import { SITE } from "@/lib/marketing/site";
import { getMarketingSettings } from "@/lib/marketing/cms/read";

/**
 * Home hero, a generated brand-colour tile (no campus photo exists yet, see `lib/marketing/media.ts`)
 * under a deep-crimson brand gradient for legibility. The dark top satisfies the shell header's
 * "translucent over a dark hero" contract. Eyebrow carries the motto; a gold pill announces the
 * open admission; dual CTAs drive the two real actions (apply / visit).
 *
 * `<HeroParallaxImage>` gives the photo a gentle scroll-linked drift (rAF, transform-only,
 * reduced-motion-safe); `.accent-pulse` gives the "admission open" dot a slow, quiet pulse.
 * The foreground text/CTAs are never transformed, so they stay crisp.
 */
export async function HomeHero() {
  const { admissionsNote } = await getMarketingSettings();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[92svh] items-center overflow-hidden px-6 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28"
    >
      <HeroParallaxImage />
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
            {SITE.name} guides children from Daycare through Junior High School in{" "}
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
            {admissionsNote}
          </p>
        </div>
      </div>
    </section>
  );
}
