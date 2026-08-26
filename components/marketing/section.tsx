import { cn } from "@/lib/utils";

export type SectionTone = "white" | "warm" | "brand" | "accent";

const TONE_CLASS: Record<SectionTone, string> = {
  white: "bg-[var(--m-canvas)] text-[var(--text)]",
  warm: "bg-[var(--m-warm)] text-[var(--text)]",
  // Royal-blue → deep-blue band: the SLIS anchor colour. Light text (AA on both stops).
  brand: "bg-[linear-gradient(155deg,var(--m-brand),var(--m-brand-deep))] text-white",
  // Gold band: uses the dark-navy ink token for text (11.3:1 on gold, AA/AAA-safe).
  accent: "bg-[var(--m-accent)] text-[var(--m-accent-ink)]",
};

interface SectionProps {
  tone?: SectionTone;
  /** Skip the centered max-width container (the child manages its own width). */
  fullBleed?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/**
 * The marketing layout wrapper. Every band on the public SLIS site is a <Section>, which gives it
 * a tone (white / warm gold-tint / blue brand band / gold accent band), consistent editorial
 * vertical rhythm, and a centered reading-width container. Alternating tones, not borders, carry
 * the page's structure.
 */
export function Section({
  tone = "white",
  fullBleed = false,
  id,
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={rest["aria-labelledby"]}
      data-tone={tone}
      className={cn(
        "relative isolate px-6 py-20 sm:px-8 sm:py-28 lg:py-32",
        TONE_CLASS[tone],
        className,
      )}
    >
      {fullBleed ? (
        children
      ) : (
        <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>{children}</div>
      )}
    </section>
  );
}
