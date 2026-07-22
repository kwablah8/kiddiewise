import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";
import { MEDIA, type ProgramKey } from "@/lib/marketing/media";

export function HomePrograms() {
  return (
    <Section tone="white" aria-labelledby="programs-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          Our programs
        </span>
        <h2
          id="programs-title"
          className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
        >
          Five stages, one journey — Creche to JHS.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted-foreground)]">
          Every level builds on the last, so children grow up inside one steady, caring community.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SITE.programs.map((program, i) => {
          const photo = MEDIA.programs[program.key as ProgramKey];
          return (
            <article key={program.key} className={`reveal${i > 0 ? ` d${Math.min(i, 4)}` : ""}`}>
              {/* The hover lift lives on this inner element, not the `.reveal` article — a CSS
                  Animation (the entrance) and a CSS Transition (the hover) fighting over
                  `transform` on the SAME element would let the still-active view()-timeline
                  animation permanently win once the hover transition finishes, silently killing
                  the lift. Splitting them across two elements avoids that. */}
              <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--m-canvas)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_-20px_rgba(16,24,40,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-[var(--m-accent)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--m-accent-ink)]">
                    {program.ageRange}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">
                    {program.name}
                  </h3>
                  <p className="mt-3 flex-1 leading-relaxed text-[var(--muted-foreground)]">
                    {program.blurb}
                  </p>
                  <Link
                    href="/admissions"
                    aria-label={`Learn more about ${program.name} admissions`}
                    className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-[var(--m-brand)] outline-none transition-colors hover:text-[var(--m-brand-deep)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2"
                  >
                    Learn more
                    <ArrowRight
                      className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
