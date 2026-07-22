import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

/**
 * The values band — honest, non-numeric content drawn straight from the school's motto. It
 * deliberately asserts NO enrollment, class-size or pass-rate figures: none are confirmed for the
 * real school, and the M4 plan's honesty guard forbids inventing them.
 */
const VALUES: readonly { name: string; blurb: string }[] = [
  { name: "Nurturing", blurb: "Warm, attentive care from a child's very first day." },
  { name: "Growing", blurb: "Steady progress, guided at each child's own pace." },
  { name: "Leading", blurb: "Confidence and character built alongside academics." },
  { name: "Excellence", blurb: "A high, honest standard held at every stage." },
];

export function HomeStatsBand() {
  return (
    <Section tone="brand" aria-labelledby="values-title" className="overflow-hidden">
      <div className="relative">
        {/* Decorative only: a soft gold glow that drifts diagonally as the band scrolls through
            view (`.band-glow`, `globals.css`). Behind the text, never affects legibility. */}
        <div
          aria-hidden="true"
          className="band-glow pointer-events-none absolute -top-24 -right-16 -z-10 size-[26rem] rounded-full bg-[var(--m-accent)]/20 blur-3xl"
        />
        <p className="reveal font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-accent)]">
          What we stand for
        </p>
        <h2
          id="values-title"
          className="reveal mt-4 max-w-3xl text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-balance text-white"
        >
          {SITE.motto}
        </h2>

        <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
          {VALUES.map((value, i) => (
            <div
              key={value.name}
              className={`reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""} border-t-2 border-[var(--m-accent)] pt-4`}
            >
              <dt className="text-2xl font-semibold tracking-[-0.01em] text-white">
                {value.name}
              </dt>
              <dd className="mt-2 leading-relaxed text-white">{value.blurb}</dd>
            </div>
          ))}
        </dl>

        <p className="reveal mt-12 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
          Creche → JHS · {SITE.admissionsNote}
        </p>
      </div>
    </Section>
  );
}
