import Image from "next/image";

import { Section } from "@/components/marketing/section";
import { MEDIA } from "@/lib/marketing/media";

const VALUES: readonly { name: string; blurb: string }[] = [
  {
    name: "Nurturing",
    blurb: "We meet every child with warmth and patience, especially in their very first days with us.",
  },
  {
    name: "Growing",
    blurb: "Each learner moves at a pace that fits them, with steady encouragement to stretch further.",
  },
  {
    name: "Leading",
    blurb: "We build confidence and character deliberately, not as an afterthought to academics.",
  },
  {
    name: "Excellence",
    blurb: "A genuinely high standard, held with care, from Creche all the way through JHS.",
  },
];

/** The real crest (shield, open book + torch) alongside the four motto values, spelled out. */
export function AboutCrestValues() {
  return (
    <Section tone="brand" aria-labelledby="crest-values-title" className="overflow-hidden">
      <div className="relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div className="reveal flex flex-col items-start gap-6">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-white p-3 shadow-lg ring-1 ring-black/[0.06]">
            <Image
              src={MEDIA.logo.src}
              alt={MEDIA.logo.alt}
              width={96}
              height={96}
              className="size-full object-contain"
            />
          </div>
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-accent)]">
              The crest
            </span>
            <h2
              id="crest-values-title"
              className="mt-3 max-w-xs text-[clamp(1.5rem,2.6vw,1.9rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white"
            >
              An open book and a torch — learning, carried forward.
            </h2>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          {VALUES.map((value, i) => (
            <div
              key={value.name}
              className={`reveal${i > 0 ? ` d${Math.min(i, 3)}` : ""} border-t-2 border-[var(--m-accent)] pt-4`}
            >
              <dt className="text-xl font-semibold tracking-[-0.01em] text-white">{value.name}</dt>
              <dd className="mt-2 leading-relaxed text-white">{value.blurb}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
