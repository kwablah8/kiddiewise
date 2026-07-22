import { Adinkra } from "@/components/marketing/adinkra";
import { SITE } from "@/components/marketing/nav-config";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  /** "light" for dark surfaces (maroon header/footer), "dark" for light surfaces. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * The school identity mark: the Nyansapɔ (wisdom knot) Adinkra in a chip, beside the name.
 * The mark is decorative; the text carries the accessible name.
 */
export function Wordmark({ tone = "dark", className }: WordmarkProps) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          light
            ? "border border-white/25 bg-white/10 text-white"
            : "bg-[var(--brand-top)] text-white",
        )}
      >
        <Adinkra name="nyansapo" className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.05rem] font-semibold tracking-[-0.01em]",
            light ? "text-white" : "text-[var(--text)]",
          )}
        >
          {SITE.short}
        </span>
        <span
          className={cn(
            "mt-1 font-mono text-[9px] uppercase tracking-[0.28em]",
            light ? "text-white/60" : "text-[var(--muted-foreground)]",
          )}
        >
          Academy
        </span>
      </span>
    </span>
  );
}
