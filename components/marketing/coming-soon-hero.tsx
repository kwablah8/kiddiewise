import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { Adinkra, type AdinkraName } from "@/components/marketing/adinkra";

interface ComingSoonHeroProps {
  eyebrow: string;
  title: string;
  blurb: string;
  symbol?: AdinkraName;
}

/**
 * Shared hero for the not-yet-built public pages (About / News / Gallery). Keeps the shell's
 * dark-hero-at-the-top contract so the translucent header reads correctly, and stays visually
 * of a piece with Home while the real content is authored later.
 */
export function ComingSoonHero({ eyebrow, title, blurb, symbol = "nkyinkyim" }: ComingSoonHeroProps) {
  return (
    <Section tone="maroon" className="overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36">
      <Adinkra
        name={symbol}
        className="pointer-events-none absolute -right-16 -bottom-16 size-[22rem] text-white/[0.05] sm:size-[30rem]"
      />
      <div className="relative max-w-2xl reveal">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
          {eyebrow}
        </span>
        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{blurb}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <CtaButton href="/admissions" variant="solid-light" size="lg" withArrow>
            Explore admissions
          </CtaButton>
          <CtaButton href="/contact" variant="ghost-on-maroon" size="lg">
            Get in touch
          </CtaButton>
        </div>
      </div>
    </Section>
  );
}
