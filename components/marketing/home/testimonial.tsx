import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

/**
 * The school's own promise, deliberately not a testimonial. The M4 honesty guard forbids
 * inventing a named parent or student quote for a real client, so this is an unattributed
 * statement in the school's voice, credited to the school itself.
 *
 * `tone="warm"`, not white: this section follows the white story section directly now that the
 * "why families choose us" band between them is gone, and two white bands in a row would flatten
 * the alternation that carries the page's structure.
 */
export function HomeTestimonial() {
  return (
    <Section tone="warm" aria-labelledby="promise-heading">
      <h2 id="promise-heading" className="sr-only">
        Our promise to families
      </h2>
      <figure className="reveal mx-auto max-w-3xl text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          Our promise
        </span>
        <blockquote className="mt-6 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.28] tracking-[-0.02em] text-balance text-[var(--text)]">
          &ldquo;Give us your child, and we will nurture them, help them grow, and teach them to
          lead — with excellence, and with care, at every stage of the journey.&rdquo;
        </blockquote>
        <figcaption className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          <span className="text-[var(--m-brand)]">{SITE.name}</span>
        </figcaption>
      </figure>
    </Section>
  );
}
