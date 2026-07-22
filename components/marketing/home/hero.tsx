import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { PhotoSlot } from "@/components/marketing/photo-slot";
import { Adinkra } from "@/components/marketing/adinkra";

const TRUST = ["Est. 1998", "Average class of 18", "98% WASSCE passes"];

export function HomeHero() {
  return (
    <Section
      tone="maroon"
      aria-labelledby="hero-title"
      className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
    >
      {/* SEAM: decorative brand watermark, not real imagery. */}
      <Adinkra
        name="nyansapo"
        className="pointer-events-none absolute -top-24 -right-24 size-[30rem] text-white/[0.05] sm:size-[38rem]"
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/75">
            <span className="size-1.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
            Independent K–12 · Kwahu Plateau, Ghana
          </span>

          <h1
            id="hero-title"
            className="mt-6 text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance"
          >
            A modern education, rooted in character.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
            For over twenty-five years, Kwahu Ridge Academy has raised curious, grounded young
            Ghanaians — from their first day in Early Years to the WASSCE — on a hilltop campus
            built for how children actually learn.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <CtaButton href="/admissions" variant="primary" size="lg" withArrow>
              Apply for admission
            </CtaButton>
            <CtaButton href="/contact" variant="ghost-on-maroon" size="lg">
              Book a visit
            </CtaButton>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            {TRUST.map((fact, i) => (
              <li key={fact} className="flex items-center gap-3">
                {i > 0 ? <span aria-hidden="true">·</span> : null}
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal d1 relative">
          {/* SEAM: real photo later */}
          <PhotoSlot
            label="Students on the steps of the main hall at morning assembly"
            aspect="4 / 5"
            tone="warm"
            symbol="aya"
            className="shadow-2xl"
          />
          <div className="absolute -bottom-5 left-6 flex items-center gap-2.5 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-xl ring-1 ring-black/[0.04]">
            <span className="size-2 rounded-full bg-[var(--primary)]" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--text)]">
              Now enrolling · 2026 / 2027
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
