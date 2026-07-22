import Image from "next/image";

import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";
import { MEDIA } from "@/lib/marketing/media";

const VALUES = ["Nurturing", "Growing", "Leading", "Excellence"] as const;

export function HomeIntro() {
  return (
    <Section tone="warm" aria-labelledby="intro-title">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="reveal">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
            Welcome
          </span>
          <h2
            id="intro-title"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
          >
            A school where children feel known.
          </h2>

          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
            <p>
              {SITE.name}{" "}was built around a simple belief — children learn best when they feel
              safe, seen, and gently stretched. From a child&apos;s first morning in Creche to their
              final year of Junior High, the same care runs through every classroom.
            </p>
            <p>
              Our motto says it plainly: <em className="text-[var(--text)] not-italic font-medium">
              {SITE.motto}</em> It is the standard we hold for every learner, at every stage.
            </p>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {VALUES.map((value) => (
              <li
                key={value}
                className="rounded-full bg-[color-mix(in_srgb,var(--m-brand),white_90%)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--m-brand)]"
              >
                {value}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal d1">
          <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/[0.06]">
            <Image
              src={MEDIA.aboutPhoto.src}
              alt={MEDIA.aboutPhoto.alt}
              width={MEDIA.aboutPhoto.width}
              height={MEDIA.aboutPhoto.height}
              sizes="(min-width: 1024px) 42rem, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
