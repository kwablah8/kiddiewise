import { cn } from "@/lib/utils";

export type SectionTone = "white" | "warm" | "maroon" | "green";

const TONE_CLASS: Record<SectionTone, string> = {
  white: "bg-[var(--surface)] text-[var(--text)]",
  warm: "bg-[var(--bg-warm)] text-[var(--text)]",
  maroon:
    "bg-[linear-gradient(160deg,var(--brand-top),var(--brand-bottom))] text-white",
  green: "bg-[var(--primary)] text-white",
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
 * The marketing layout wrapper. Every band on the public site is a <Section>, which gives it a
 * tone (white / warm off-white / maroon / green), consistent editorial vertical rhythm, and a
 * centered reading-width container. Alternating tones — not borders — carry the page's structure.
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
