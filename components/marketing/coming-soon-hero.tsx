import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";

interface ComingSoonHeroProps {
  eyebrow: string;
  title: string;
  blurb: string;
}

/**
 * Shared hero for the not-yet-built public pages (About / News / Gallery, authored for real in
 * M4 Unit C). Keeps the shell's dark-hero-at-the-top contract so the translucent header reads
 * correctly, and stays visually of a piece with Home while the real content is written later.
 */
export function ComingSoonHero({ eyebrow, title, blurb }: ComingSoonHeroProps) {
  return (
    <Section tone="brand" className="overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36">
      <div className="relative max-w-2xl reveal">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white">
          {eyebrow}
        </span>
        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white">{blurb}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <CtaButton href="/admissions" variant="gold" size="lg" withArrow>
            Explore admissions
          </CtaButton>
          <CtaButton href="/contact" variant="ghost-light" size="lg">
            Get in touch
          </CtaButton>
        </div>
      </div>
    </Section>
  );
}
