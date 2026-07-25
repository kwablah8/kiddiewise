import Image from "next/image";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface CrestProps {
  /**
   * Which surface the crest sits on. "light" = a dark/navy surface (sidebar, auth panel, hero) and
   * gets a translucent white ring; "dark" = a white/light surface and gets a faint black hairline.
   */
  tone?: "light" | "dark";
  /** Sizing and spacing overrides — pass a `size-*` to change the chip's dimensions. */
  className?: string;
  /** `next/image` sizing hint. Keep it in step with the rendered chip size. */
  sizes?: string;
  /**
   * Set when the crest stands ALONE with no adjacent school name, so it needs to carry the
   * accessible name itself. Default is decorative (`alt=""`), which is correct wherever the
   * wordmark sits next to it — otherwise a screen reader announces the school twice.
   */
  standalone?: boolean;
}

/**
 * The SLIS crest in a white chip.
 *
 * The white chip is LOAD-BEARING, not decoration: `public/slis/logo.jpg` has a white background, so
 * without the chip the crest's edges would dissolve into the navy sidebar and auth panel.
 *
 * Shared by the marketing header/footer, the portal sidebar, the auth screens and the parent shell
 * — which is why it reads `lib/brand.ts` rather than the marketing media manifest.
 */
export function Crest({ tone = "dark", className, sizes = "36px", standalone = false }: CrestProps) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1",
        tone === "light" ? "ring-1 ring-white/50" : "ring-1 ring-black/[0.06]",
        className,
      )}
    >
      <Image
        src={BRAND.crest.src}
        alt={standalone ? BRAND.crest.alt : ""}
        fill
        sizes={sizes}
        className="object-contain p-0.5"
      />
    </span>
  );
}
