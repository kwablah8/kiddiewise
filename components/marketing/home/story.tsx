import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";
import { MEDIA } from "@/lib/marketing/media";

/**
 * "Watch our story" — the school's own promo video, lazily loaded (`preload="none"`, so the
 * ~MB file only downloads on play) behind a poster frame, muted by default, with native controls.
 */
export function HomeStory() {
  return (
    <Section tone="white" aria-labelledby="story-title">
      <div className="mx-auto max-w-2xl text-center reveal">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          Watch our story
        </span>
        <h2
          id="story-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          A look inside {SITE.shortName}.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
          A short walk through our campus, our classrooms, and the community your child would join.
        </p>
      </div>

      <div className="reveal d1 mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/[0.06]">
        <video
          controls
          muted
          playsInline
          preload="none"
          poster={MEDIA.promoPoster.src}
          aria-label={`${SITE.name} promotional video`}
          className="aspect-video h-full w-full bg-[var(--m-brand-deep)]"
        >
          <source src={MEDIA.promoVideo.src} type="video/mp4" />
          Your browser does not support embedded video. You can{" "}
          <a href={MEDIA.promoVideo.src}>download it here</a>.
        </video>
      </div>
    </Section>
  );
}
