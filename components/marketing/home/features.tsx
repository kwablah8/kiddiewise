import { Compass, Heart, School, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

interface Feature {
  icon: LucideIcon;
  title: string;
  blurb: string;
}

const FEATURES: readonly Feature[] = [
  {
    icon: Heart,
    title: "One caring community",
    blurb:
      "The same familiar team walks with your child from Creche to JHS, so every learner is genuinely known — not a number in a register.",
  },
  {
    icon: Sprout,
    title: "Play that grows into purpose",
    blurb:
      "Early years learn through guided play; older learners build on that with structure and steadily higher expectations.",
  },
  {
    icon: School,
    title: "Every stage on one campus",
    blurb:
      "Creche, Nursery, Kindergarten, Primary and Junior High sit side by side in Oyarifa — a settled, unbroken journey for your family.",
  },
  {
    icon: Compass,
    title: "Character alongside academics",
    blurb:
      "Nurturing, growing and leading are taught as deliberately as reading and numbers, so children leave us ready to lead with excellence.",
  },
];

export function HomeFeatures() {
  return (
    <Section tone="warm" aria-labelledby="features-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          Why families choose {SITE.shortName}
        </span>
        <h2
          id="features-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          A start worth building a childhood on.
        </h2>
      </div>

      <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className={`reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""}`}>
              {/* Hover lift lives on this inner element, not the `.reveal` div — see the same
                  note in `programs.tsx` (an entrance CSS Animation and a hover CSS Transition
                  can't safely share one element's `transform`). */}
              <div className="group flex gap-5 border-t border-[var(--border)] pt-8 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--m-brand),white_90%)] text-[var(--m-brand)] ring-1 ring-[color-mix(in_srgb,var(--m-brand),white_75%)] transition-[transform,box-shadow] duration-200 group-hover:scale-[1.06] group-hover:shadow-[0_10px_24px_-14px_rgba(65,105,225,0.5)] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.01em] text-[var(--text)]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]">
                    {feature.blurb}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
