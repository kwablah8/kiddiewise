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
}: BrandLockProps) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <Crest tone={tone} className={crestClassName} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate text-[1.05rem] font-semibold tracking-[-0.01em]",
            light ? "text-white" : "text-[var(--text)]",
          )}
        >
          {BRAND.shortName}
        </span>
        {!compact && (
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
