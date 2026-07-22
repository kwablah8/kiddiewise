import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

/**
 * The five real Creche → JHS levels, with age ranges — the same `SITE.programs` used on Home,
 * but presented as a compact reference list (not photo cards) since a family arriving on
 * Admissions is scanning for "which stage is my child" rather than browsing.
 */
export function AdmissionsPrograms() {
  return (
    <Section tone="warm" aria-labelledby="admissions-programs-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          Our programs
        </span>
        <h2
          id="admissions-programs-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          Five stages, Creche to JHS.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--muted-foreground)]">
          Find your child&apos;s stage below — every level shares one campus, one community, and
          the inquiry process on this page.
        </p>
      </div>

      <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {SITE.programs.map((program, i) => (
          <li
            key={program.key}
            className={`reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""} border-t-2 border-[var(--m-brand)] pt-5`}
          >
            <span className="inline-flex rounded-full bg-[var(--m-accent)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--m-accent-ink)]">
              {program.ageRange}
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--text)]">
              {program.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {program.blurb}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
