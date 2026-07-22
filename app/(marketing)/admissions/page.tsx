import type { Metadata } from "next";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { AdmissionsPrograms } from "@/components/marketing/admissions/programs-overview";
import { AdmissionsProcessSteps } from "@/components/marketing/admissions/process-steps";
import { AdmissionsRequirements } from "@/components/marketing/admissions/requirements";
import { InquiryForm } from "@/components/marketing/admissions/inquiry-form";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = { title: "Admissions" };

/**
 * Admissions — the funnel's main conversion page (01-REQ "Marketing website": process,
 * requirements, contact). Hero -> process steps -> requirements -> the inquiry form, which
 * writes into `admissions_inquiries` via the mock seam (05-USER-FLOWS §10).
 */
export default function AdmissionsPage() {
  return (
    <>
      <Section
        tone="brand"
        aria-labelledby="admissions-hero-title"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
      >
        <div className="relative max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
            <span className="size-1.5 rounded-full bg-[var(--m-accent)]" aria-hidden="true" />
            {SITE.admissionsNote}
          </span>
          <h1
            id="admissions-hero-title"
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-white"
          >
            Join our school community.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white sm:text-xl">
            Admission to {SITE.name}{" "}
            runs on a simple, personal process — from a first conversation to your
            child&apos;s first morning in class. Here&apos;s exactly what to expect.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaButton href="#inquiry" variant="gold" size="lg" withArrow>
              Start an inquiry
            </CtaButton>
            <CtaButton href="/contact" variant="ghost-light" size="lg">
              Get in touch
            </CtaButton>
          </div>
        </div>
      </Section>

      <AdmissionsPrograms />
      <AdmissionsProcessSteps />
      <AdmissionsRequirements />

      <Section tone="white" id="inquiry" aria-labelledby="inquiry-title">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="reveal">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
              Start here
            </span>
            <h2
              id="inquiry-title"
              className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
            >
              Tell us about your child.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-[var(--muted-foreground)]">
              Share a few details below and our admissions team will reach out to arrange a visit
              and walk you through the next step — no obligation, just a conversation.
            </p>
            <p className="mt-8 text-sm text-[var(--muted-foreground)]">
              Prefer to talk first?{" "}
              <a
                href={`mailto:${SITE.contact.email}`}
                className="rounded-md font-medium text-[var(--m-brand)] outline-none transition-colors hover:text-[var(--m-brand-deep)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2"
              >
                {SITE.contact.email}
              </a>{" "}
              or {SITE.contact.phones.join(" / ")}.
            </p>
          </div>

          <InquiryForm className="reveal d1" />
        </div>
      </Section>
    </>
  );
}
