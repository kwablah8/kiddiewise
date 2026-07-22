import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { Adinkra } from "@/components/marketing/adinkra";

export function HomeAdmissionsCta() {
  return (
    <Section tone="green" aria-labelledby="admissions-cta-title" className="overflow-hidden">
      <Adinkra
        name="nyansapo"
        className="pointer-events-none absolute -top-16 -right-16 size-[24rem] text-white/[0.08]"
      />
      <div className="relative mx-auto max-w-2xl text-center reveal">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
          Admissions · 2026 / 2027
        </span>
        <h2
          id="admissions-cta-title"
          className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance"
        >
          Enrolment is open for the coming year.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-white/85">
          Places are limited and Early Years fills first. Start an application, or book a visit —
          we&apos;d love to show you the ridge.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <CtaButton href="/admissions" variant="solid-light" size="lg" withArrow>
            Apply for admission
          </CtaButton>
          <CtaButton href="/contact" variant="ghost-on-maroon" size="lg">
            Book a visit
          </CtaButton>
        </div>
      </div>
    </Section>
  );
}
