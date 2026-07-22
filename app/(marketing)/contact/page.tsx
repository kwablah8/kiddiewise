import type { Metadata } from "next";

import { Section } from "@/components/marketing/section";
import { Adinkra } from "@/components/marketing/adinkra";
import { ContactDetails } from "@/components/marketing/contact/contact-details";
import { ContactForm } from "@/components/marketing/contact/contact-form";

export const metadata: Metadata = { title: "Contact" };

/**
 * Contact — address/phone/email + a map placeholder alongside the same inquiry form used on
 * Admissions (01-REQ "Marketing website": Contact). Both write into `admissions_inquiries` via
 * the shared mock seam.
 */
export default function ContactPage() {
  return (
    <>
      <Section
        tone="maroon"
        aria-labelledby="contact-hero-title"
        className="overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24"
      >
        <Adinkra
          name="fihankra"
          className="pointer-events-none absolute -top-16 -left-16 size-[26rem] text-white/[0.05] sm:size-[32rem]"
        />
        <div className="relative max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/75">
            Contact
          </span>
          <h1
            id="contact-hero-title"
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance"
          >
            We&apos;d love to hear from you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
            Questions about admissions, a visit, or anything else about life on the ridge — reach
            us directly or send a message below.
          </p>
        </div>
      </Section>

      <Section tone="white" aria-labelledby="contact-form-title">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
              Get in touch
            </span>
            <h2
              id="contact-form-title"
              className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance reveal"
            >
              Visit, call, or write.
            </h2>
            <div className="mt-8">
              <ContactDetails />
            </div>
          </div>

          <ContactForm />
        </div>
      </Section>
    </>
  );
}
