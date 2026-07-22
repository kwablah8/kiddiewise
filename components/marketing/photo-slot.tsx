import { Adinkra, type AdinkraName } from "@/components/marketing/adinkra";
import { cn } from "@/lib/utils";

/**
 * PhotoSlot — a local, tasteful stand-in for real photography.
 *
 * SEAM: replace with a real photo / Supabase Storage asset later. Every image on the marketing
 * site is one of these: a fixed-aspect, token-tinted panel carrying a faint Adinkra watermark
 * and a caption describing the intended shot. It exposes `role="img"` + `aria-label` so it reads
 * as an image to assistive tech today, and the `label` doubles as the future photo's alt text.
 * No external image hosts.
 */

type PhotoTone = "warm" | "maroon" | "green" | "neutral";

const TONE: Record<PhotoTone, { bg: string; mark: string; caption: string; ring: string }> = {
  warm: {
    bg: "bg-[linear-gradient(135deg,var(--bg-warm),color-mix(in_oklch,var(--brand-top),white_88%))]",
    mark: "text-[var(--brand-top)]/[0.12]",
    caption: "text-[var(--muted-foreground)]",
    ring: "ring-black/[0.06]",
  },
  neutral: {
    bg: "bg-[linear-gradient(135deg,var(--surface),var(--bg-warm))]",
    mark: "text-[var(--brand-top)]/[0.1]",
    caption: "text-[var(--muted-foreground)]",
    ring: "ring-black/[0.06]",
  },
  green: {
    bg: "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary),white_80%),color-mix(in_oklch,var(--primary),white_92%))]",
    mark: "text-[var(--primary)]/25",
    caption: "text-[color-mix(in_oklch,var(--primary),black_20%)]",
    ring: "ring-[var(--primary)]/20",
  },
  maroon: {
    bg: "bg-[linear-gradient(155deg,var(--brand-top),var(--brand-bottom))]",
    mark: "text-white/12",
    caption: "text-white/70",
    ring: "ring-white/10",
  },
};

interface PhotoSlotProps {
  /** Describes the intended shot; used as the accessible name and the future photo's alt. */
  label: string;
  /** CSS aspect-ratio, e.g. "4 / 3", "3 / 4", "16 / 10". */
  aspect?: string;
  tone?: PhotoTone;
  symbol?: AdinkraName;
  className?: string;
}

export function PhotoSlot({
  label,
  aspect = "4 / 3",
  tone = "warm",
  symbol = "nyansapo",
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
      <Adinkra
        name={symbol}
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2",
          t.mark,
        )}
      />
      <span
        className={cn(
          "absolute bottom-4 left-4 right-4 font-mono text-[10px] uppercase tracking-[0.18em]",
          t.caption,
        )}
      >
        {label}
      </span>
    </div>
  );
}
