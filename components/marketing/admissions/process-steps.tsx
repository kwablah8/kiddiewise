import { Section } from "@/components/marketing/section";
import { Adinkra, type AdinkraName } from "@/components/marketing/adinkra";

interface Step {
  symbol: AdinkraName;
  title: string;
  blurb: string;
}

const STEPS: readonly Step[] = [
  {
    symbol: "nkyinkyim",
    title: "Enquire",
    blurb:
      "Send us the inquiry form below (or call). Our admissions team replies within two working days with next steps.",
  },
  {
    symbol: "fihankra",
    title: "Visit & assess",
    blurb:
      "Tour the campus and meet the team. Early Years applicants join a settling-in session; older applicants sit a short, friendly placement assessment.",
  },
  {
    symbol: "sankofa",
    title: "Apply",
    blurb:
      "Submit the completed application with the supporting documents listed below, along with the registration fee.",
  },
  {
    symbol: "nyansapo",
    title: "Offer & enrol",
    blurb:
      "Receive your offer letter, confirm the place with first-term fees, and join us for orientation day before term begins.",
  },
];

export function AdmissionsProcessSteps() {
  return (
    <Section tone="white" aria-labelledby="process-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
          How it works
        </span>
        <h2
          id="process-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em]"
        >
          Four steps from inquiry to enrolment.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
          We keep admissions personal — every family meets the team before a place is offered.
        </p>
      </div>

      <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className={`reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""} relative border-t border-[var(--border)] pt-6`}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--primary),white_90%)] text-[var(--primary)]">
                <Adinkra name={step.symbol} className="size-5" />
              </span>
              <span
                className="font-mono text-sm tracking-[0.08em] text-[var(--muted-foreground)]"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--text)]">
              {step.title}
            </h3>
            <p className="mt-2 leading-relaxed text-[var(--muted-foreground)]">{step.blurb}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
