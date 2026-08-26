"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { MEDIA } from "@/lib/marketing/media";

/**
 * Hero background image with a lightweight, reliable parallax.
 *
 * We drive the drift with a rAF-throttled scroll handler rather than a CSS scroll-driven
 * timeline: the hero <img> lives inside an `overflow-hidden` section, which leaves a CSS
 * `view()`/`scroll()` timeline inactive (its `currentTime` never resolves → no transform ever
 * applies). This approach works in every browser, writes only `transform` (compositor-only,
 * no layout thrash), and is fully disabled under `prefers-reduced-motion`.
 *
 * The image is pre-scaled (`scale(1.25)`) so the vertical drift never reveals its edges, and it
 * translates down as the page scrolls, moving up ~12% slower than the content for a gentle lag.
 */
export function HeroParallaxImage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const progress = Math.min(Math.max(window.scrollY, 0) / vh, 1); // 0..1 over first viewport
      const pct = (progress * 12).toFixed(2); // 0% → 12% drift
      el.style.transform = `translate3d(0, ${pct}%, 0) scale(1.25)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <div
        ref={ref}
        className="absolute inset-0 will-change-transform motion-reduce:transform-none"
        style={{ transform: "translate3d(0,0,0) scale(1.25)" }}
      >
        <Image
          src={MEDIA.community.src}
          alt={MEDIA.community.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
