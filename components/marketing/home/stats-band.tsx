import { Section } from "@/components/marketing/section";
import { Adinkra } from "@/components/marketing/adinkra";
import { SITE } from "@/components/marketing/nav-config";
import { formatPercent } from "@/lib/format";

const yearsOnTheRidge = new Date().getFullYear() - SITE.foundedYear;

const STATS: readonly { value: string; label: string }[] = [
  { value: "1,240", label: "Students on campus" },
  { value: "96", label: "Teachers & mentors" },
  { value: String(yearsOnTheRidge), label: "Years on the ridge" },
  { value: formatPercent(98), label: "WASSCE pass rate" },
];

export function HomeStatsBand() {
  return (
    <Section tone="maroon" aria-labelledby="stats-title" className="overflow-hidden">
      <Adinkra
        name="aya"
        className="pointer-events-none absolute -bottom-20 -left-16 size-[26rem] text-white/[0.04]"
      />
      <div className="relative">
        <h2 id="stats-title" className="sr-only">
          The school by the numbers
        </h2>
        <p className="reveal font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">
          By the numbers
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 sm:gap-x-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal${i > 0 ? ` d${i}` : ""} sm:border-l sm:border-white/12 sm:pl-6`}
            >
              <dd className="text-[clamp(2.5rem,5vw,3.75rem)] font-bold leading-none tracking-[-0.03em] tabular-nums">
                {stat.value}
              </dd>
              <dt className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
