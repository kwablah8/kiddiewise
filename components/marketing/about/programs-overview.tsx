import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { SITE } from "@/lib/marketing/site";

/** A compact recap of the five real levels, linking through to the full Admissions page. */
export function AboutProgramsOverview() {
  return (
    <Section tone="warm" aria-labelledby="about-programs-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          The journey
        </span>
        <h2
          id="about-programs-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          One school, Creche to JHS.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
          {SITE.tagline}
        </p>
      </div>

      <ol className="mt-10 flex flex-wrap gap-3">
        {SITE.programs.map((program) => (
          <li
            key={program.key}
            className="rounded-full border border-[var(--border)] bg-[var(--m-canvas)] px-4 py-2 text-sm font-medium text-[var(--text)]"
          >
            {program.name}{" "}
            <span className="text-[var(--muted-foreground)]">· {program.ageRange}</span>
          </li>
        ))}
      </ol>

      <div className="reveal d1 mt-10">
        <CtaButton href="/admissions" variant="brand" size="lg" withArrow>
          See admissions requirements
        </CtaButton>
      </div>
    </Section>
  );
}
