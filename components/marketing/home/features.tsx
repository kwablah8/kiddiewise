import { Section } from "@/components/marketing/section";
import { Adinkra, ADINKRA_MEANING, type AdinkraName } from "@/components/marketing/adinkra";

interface Feature {
  symbol: AdinkraName;
  title: string;
  blurb: string;
}

const FEATURES: readonly Feature[] = [
  {
    symbol: "sankofa",
    title: "Character first",
    blurb:
      "Kindness, honesty and pride in one's roots are taught as deliberately as maths and reading.",
  },
  {
    symbol: "nyansapo",
    title: "Teaching that sticks",
    blurb:
      "Specialist teachers who love their subjects — and know every child in the room by name.",
  },
  {
    symbol: "fihankra",
    title: "A close community",
    blurb:
      "An average class of eighteen and a pastoral team that actually notices when something's off.",
  },
  {
    symbol: "aya",
    title: "The whole child",
    blurb:
      "Sport, music, coding and farming — because character is built well beyond the desk.",
  },
];

export function HomeFeatures() {
  return (
    <Section tone="warm" aria-labelledby="features-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
          Why families choose us
        </span>
        <h2
          id="features-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]"
        >
          What makes the ridge different.
        </h2>
      </div>

      <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className={`reveal d${i} flex gap-5 border-t border-[var(--border)] pt-8`}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--brand-top)] ring-1 ring-black/[0.05]">
              <Adinkra name={feature.symbol} className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.01em] text-[var(--text)]">
                {feature.title}
              </h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {ADINKRA_MEANING[feature.symbol].name}
              </p>
              <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
                {feature.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
