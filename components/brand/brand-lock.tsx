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
   * Which name to show. "short" is the short name over the descriptor, the right call in the
   * portal sidebar and other tight chrome, where the full name simply does not fit.
   *
   * "full" spells the school out and drops the descriptor, avoiding printing overlapping words
   * twice (e.g. a descriptor that repeats a word already in the full name). The split is by
   * audience, not surface: anywhere a parent or visitor can arrive cold, the marketing header, the
   * auth screens, the parent shell, spells the name out, because they may never have seen the
   * short name written down. Staff chrome (the portal sidebar, the admin mobile bar) keeps the
   * short lock: an administrator already knows where they are, and the sidebar does not have the
   * room anyway.
   */
  name?: "short" | "full";
}

/**
 * The identity lock: crest + short name over descriptor.
 *
 * Six surfaces show this exact pairing: marketing header, marketing footer, portal sidebar, the
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
            // The full name is 25 characters, so it wraps onto two lines rather than truncating,
            // a mid-word ellipsis would be worse than no change at all. `max-w` caps how far it can
            // push the nav; `leading-tight` keeps the two lines reading as one mark.
            full ? "max-w-[13rem] leading-tight text-balance" : "truncate",
          )}
        >
          {full ? BRAND.fullName : BRAND.shortName}
        </span>
        {!compact && !full && (
          <span
            className={cn(
              // Full white on dark, not a dimmed tint: on the marketing header this line sits over
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
