import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PhotoSlot: a local, tasteful stand-in for imagery that isn't a real photo yet.
 *
 * Real photos come from `MEDIA` (`lib/marketing/media.ts`). The last remaining uses of this
 * placeholder are non-photographic slots on the not-yet-built Unit C pages (e.g. the Contact map
 * embed, an admissions document photo). It renders a fixed-aspect, SLIS-tinted panel with a
 * neutral icon + a caption describing the intended asset. It exposes `role="img"` + `aria-label`
 * so it reads as an image to assistive tech today, and the `label` doubles as the future alt text.
 */

type PhotoTone = "warm" | "neutral" | "brand";

const TONE: Record<PhotoTone, { bg: string; mark: string; caption: string; ring: string }> = {
  warm: {
    bg: "bg-[linear-gradient(135deg,var(--m-warm),color-mix(in_srgb,var(--m-brand),white_90%))]",
    mark: "text-[color-mix(in_srgb,var(--m-brand),white_45%)]",
    caption: "text-[var(--muted-foreground)]",
    ring: "ring-black/[0.06]",
  },
  neutral: {
    bg: "bg-[linear-gradient(135deg,var(--m-canvas),color-mix(in_srgb,var(--m-brand),white_92%))]",
    mark: "text-[color-mix(in_srgb,var(--m-brand),white_50%)]",
    caption: "text-[var(--muted-foreground)]",
    ring: "ring-black/[0.06]",
  },
  brand: {
    bg: "bg-[linear-gradient(155deg,var(--m-brand),var(--m-brand-deep))]",
    mark: "text-white/25",
    caption: "text-white/70",
    ring: "ring-white/10",
  },
};

interface PhotoSlotProps {
  /** Describes the intended asset; used as the accessible name and the future photo's alt. */
  label: string;
  /** CSS aspect-ratio, e.g. "4 / 3", "3 / 4", "16 / 10". */
  aspect?: string;
  tone?: PhotoTone;
  /** Hide the visible caption (still exposed as the accessible name), for small slots. */
  hideCaption?: boolean;
  className?: string;
}

export function PhotoSlot({
  label,
  aspect = "4 / 3",
  tone = "neutral",
  hideCaption = false,
  className,
}: PhotoSlotProps) {
  const t = TONE[tone];
  return (
    <div
      role="img"
      aria-label={label}
      style={{ aspectRatio: aspect }}
      className={cn(
        "relative isolate overflow-hidden rounded-3xl ring-1 ring-inset",
        t.bg,
        t.ring,
        className,
      )}
    >
      <ImageIcon
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 size-[22%] max-h-24 max-w-24 -translate-x-1/2 -translate-y-1/2",
          t.mark,
        )}
        aria-hidden="true"
      />
      {hideCaption ? null : (
        <span
          className={cn(
            "absolute right-4 bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em]",
            t.caption,
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
