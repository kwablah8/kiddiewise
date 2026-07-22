import Image from "next/image";

import { SITE } from "@/lib/marketing/site";
import { MEDIA } from "@/lib/marketing/media";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  /** "light" for dark (blue) surfaces — header/footer bands, "dark" for the white header/menu. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * The SLIS identity mark: the real crest (a shield with an open book + torch, from the school's
 * own logo) in a white chip, beside the wordmark text. The crest artwork has a WHITE background,
 * so on dark (blue) surfaces the chip is load-bearing — without it the crest would vanish into
 * the band. On light surfaces the chip just adds a soft boundary. The mark is decorative
 * (`alt=""`); the adjacent text carries the accessible name (parent links also set
 * `aria-label`).
 */
export function Wordmark({ tone = "dark", className }: WordmarkProps) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1",
          light ? "ring-1 ring-white/50" : "ring-1 ring-black/[0.06]",
        )}
      >
        <Image
          src={MEDIA.logo.src}
          alt=""
          fill
          sizes="36px"
          className="object-contain p-0.5"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.05rem] font-semibold tracking-[-0.01em]",
            light ? "text-white" : "text-[var(--text)]",
          )}
        >
          {SITE.shortName}
        </span>
        <span
          className={cn(
            "mt-1 font-mono text-[9px] uppercase tracking-[0.22em]",
            light ? "text-white/60" : "text-[var(--muted-foreground)]",
          )}
        >
          Learners International
        </span>
      </span>
    </span>
  );
}
