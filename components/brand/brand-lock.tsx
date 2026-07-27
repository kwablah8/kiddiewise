import { Crest } from "@/components/brand/crest";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandLockProps {
  /** "light" for dark/navy surfaces (sidebar, auth panel, hero bands); "dark" for white surfaces. */
  tone?: "light" | "dark";
  /** Hide the descriptor line, for tight chrome where only the initialism fits. */
  compact?: boolean;
  className?: string;
  /** Sizing override forwarded to the crest chip. */
  crestClassName?: string;
  /**
   * Which name to show. "short" is the initialism over the descriptor — the right call in the
   * portal sidebar and other tight chrome, where the full name simply does not fit.
   *
   * "full" spells the school out and drops the descriptor, because "Learners International" is a
   * fragment of "SNAB Learners International School" and printing both says the same words twice.
   * Opt-in rather than the default: six surfaces render this lock, and only the public site has the
   * room. A visitor who has never heard of the school needs the whole name; a signed-in
   * administrator already knows where they are.
   */
  name?: "short" | "full";
}

/**
 * The identity lock: crest + "SLIS" over "Learners International".
 *
 * Six surfaces show this exact pairing — marketing header, marketing footer, portal sidebar, the
 * auth screens' desktop panel and mobile band, and the parent shell. Keeping it here stops the
 * name/descriptor pair being retyped (and drifting) in each one.
 */
export function BrandLock({
  tone = "dark",
  compact = false,
  className,
  crestClassName,
  name = "short",
}: BrandLockProps) {
  const light = tone === "light";
  const full = name === "full";
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <Crest tone={tone} className={crestClassName} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "text-[1.05rem] font-semibold tracking-[-0.01em]",
            light ? "text-white" : "text-[var(--text)]",
            // The full name is 31 characters, so it wraps onto two lines rather than truncating —
            // "SNAB Learners Internationa…" would be worse than no change at all. `max-w` caps how
            // far it can push the nav; `leading-tight` keeps the two lines reading as one mark.
            full ? "max-w-[13rem] leading-tight text-balance" : "truncate",
          )}
        >
          {full ? BRAND.fullName : BRAND.shortName}
        </span>
        {!compact && !full && (
          <span
            className={cn(
              // Full white on dark, NOT a dimmed tint: on the marketing header this line sits over
              // a photographic hero, where anything translucent loses legibility against the image.
              "mt-1 truncate font-mono text-[9px] tracking-[0.22em] uppercase",
              light ? "text-white" : "text-[var(--muted-foreground)]",
            )}
          >
            {BRAND.descriptor}
          </span>
        )}
      </span>
    </span>
  );
}
