import { CheckCircle2 } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { PhotoSlot } from "@/components/marketing/photo-slot";

const REQUIREMENTS: readonly string[] = [
  "Completed application form (submitted with the inquiry below)",
  "Certified copy of the child's birth certificate",
  "Two recent passport-sized photographs",
  "Immunisation / health record",
  "Most recent school report card (transfer applicants)",
  "A parent or guardian's Ghana Card or passport bio page",
  "Registration fee, payable once a place is offered",
];

export function AdmissionsRequirements() {
  return (
    <Section tone="warm" aria-labelledby="requirements-title">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="reveal">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
            What you&apos;ll need
          </span>
          <h2
            id="requirements-title"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
          >
            Requirements for a complete application.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--muted-foreground)]">
            Gather these ahead of your visit so we can move from assessment to offer without
            delay. Missing a document? Start the inquiry anyway — we&apos;ll guide you through it.
          </p>

          <ul className="mt-8 space-y-4">
            {REQUIREMENTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-[var(--primary)]"
                  aria-hidden="true"
                />
                <span className="leading-relaxed text-[var(--text)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal d1">
          {/* SEAM: real photo later */}
          <PhotoSlot
            label="A parent and admissions officer reviewing an application folder together"
            aspect="4 / 5"
            tone="neutral"
            symbol="aya"
            className="shadow-xl"
          />
        </div>
      </div>
    </Section>
  );
}
