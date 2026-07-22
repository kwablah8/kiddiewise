import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { Adinkra, ADINKRA_MEANING, type AdinkraName } from "@/components/marketing/adinkra";

interface Program {
  stage: string;
  range: string;
  symbol: AdinkraName;
  blurb: string;
}

const PROGRAMS: readonly Program[] = [
  {
    stage: "Early Years",
    range: "Crèche – KG",
    symbol: "fihankra",
    blurb:
      "A gentle, playful start where confidence and curiosity take root, guided by teachers who nurture.",
  },
  {
    stage: "Primary",
    range: "Basic 1 – 6",
    symbol: "nkyinkyim",
    blurb:
      "Strong foundations in literacy, numeracy and wonder — taught in small, attentive groups.",
  },
  {
    stage: "High School",
    range: "JHS – SHS · WASSCE",
    symbol: "dwennimmen",
    blurb:
      "Academic rigour and real character, all the way to a WASSCE that opens doors at home and abroad.",
  },
];

export function HomePrograms() {
  return (
    <Section tone="white" aria-labelledby="programs-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
          Our school
        </span>
        <h2
          id="programs-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]"
        >
          Three stages, one throughline.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
          The same values carry a child from their first day to their last — expressed differently
          at every age.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PROGRAMS.map((program, i) => {
          const meaning = ADINKRA_MEANING[program.symbol];
          return (
            <article
              key={program.stage}
              className={`reveal d${i + 1} group flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(16,24,40,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--primary),white_90%)] text-[var(--primary)]">
                <Adinkra name={program.symbol} className="size-7" />
              </span>

              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {program.range}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">
                {program.stage}
              </h3>
              <p className="mt-1 font-mono text-[11px] tracking-wide text-[var(--muted-foreground)]">
                <span className="text-[var(--brand-top)]">{meaning.name}</span> · {meaning.meaning}
              </p>

              <p className="mt-4 flex-1 leading-relaxed text-[var(--muted-foreground)]">
                {program.blurb}
              </p>

              <Link
                href="/admissions"
                className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-[var(--primary)] outline-none transition-colors hover:text-[color-mix(in_oklch,var(--primary),black_15%)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              >
                Learn more
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </Link>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
