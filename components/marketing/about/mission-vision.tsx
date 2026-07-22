import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

/**
 * Mission & vision statements grounded in the school's real motto and positioning (Creche → JHS,
 * one Oyarifa campus) — not invented history or figures, per the M4 honesty guard.
 */
const PILLARS: readonly { label: string; body: string }[] = [
  {
    label: "Mission",
    body:
      "To nurture, grow and lead every learner who joins us — from a child's first morning in " +
      "Creche to their final year of Junior High — with genuine care, steady structure, and a " +
      "consistently high standard, at every one of our five stages.",
  },
  {
    label: "Vision",
    body:
      `A single, close-knit campus in ${SITE.location.lines[0]} where every early stage of a ` +
      "child's education happens under one roof, among people who know them by name.",
  },
];

export function AboutMissionVision() {
  return (
    <Section tone="white" aria-labelledby="mission-vision-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          What we stand for
        </span>
        <h2
          id="mission-vision-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          Our mission and vision.
        </h2>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-2">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.label}
            className={`reveal${i > 0 ? " d1" : ""} rounded-3xl border border-[var(--border)] bg-[var(--m-warm)] p-8`}
          >
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--m-brand)]">
              {pillar.label}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text)]">{pillar.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
