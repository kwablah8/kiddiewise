import { Section } from "@/components/marketing/section";
import { Adinkra } from "@/components/marketing/adinkra";

export function HomeTestimonial() {
  return (
    <Section tone="white" aria-labelledby="testimonial-heading">
      <h2 id="testimonial-heading" className="sr-only">
        What parents say
      </h2>
      <figure className="reveal mx-auto max-w-3xl text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--brand-top),white_90%)] text-[var(--brand-top)]">
          <Adinkra name="sankofa" className="size-6" />
        </span>
        <blockquote className="mt-8 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.28] tracking-[-0.02em] text-balance text-[var(--text)]">
          &ldquo;We moved from Accra so our daughter could learn here. Three years on, she reads
          for pleasure, argues with evidence, and still greets her elders properly. That balance
          is rare.&rdquo;
        </blockquote>
        <figcaption className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          <span className="text-[var(--primary)]">Kwame Asante</span> · parent, Basic 5
        </figcaption>
      </figure>
    </Section>
  );
}
