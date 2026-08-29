import { Check, Laptop, type LucideIcon, Palette, Sun, Trophy } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { SITE } from "@/lib/marketing/site";

/**
 * A small, curated accent palette, one warm colour per card, that gives the section a
 * children's-school feel while still harmonising with the blue/gold brand. These are decorative
 * accent hues (soft card fill + border, gradient sticker-style icon tile, tinted check), not brand
 * tokens, so they live here rather than in globals; the brand blue (#4169e1) anchors one of the
 * four. `card` is the card fill + border, `tile` the icon gradient, `check` the tick colour,
 * `ring` the check chip's hairline.
 */
type Accent = "gold" | "emerald" | "rose" | "blue";

const ACCENT: Record<Accent, { card: string; tile: string; check: string; ring: string }> = {
  gold: {
    card: "bg-[#FFF6E0] border-[#F1DFA6]",
    tile: "from-[#FBBF24] to-[#D97706]",
    check: "text-[#B45309]",
    ring: "ring-[#F3E4B4]",
  },
  emerald: {
    card: "bg-[#E9FBF1] border-[#B7EBD0]",
    tile: "from-[#34D399] to-[#059669]",
    check: "text-[#047857]",
    ring: "ring-[#BFEAD4]",
  },
  rose: {
    card: "bg-[#FFF0F3] border-[#FBD0D9]",
    tile: "from-[#FB7185] to-[#E11D48]",
    check: "text-[#BE123C]",
    ring: "ring-[#FBD3DB]",
  },
  blue: {
    card: "bg-[#EEF3FF] border-[#C9D8FF]",
    tile: "from-[#60A5FA] to-[#4169E1]",
    check: "text-[#1D4ED8]",
    ring: "ring-[#D3DEFF]",
  },
};

/** Each offering's icon + accent, keyed on the stable `SITE.offerings` key (icons/colours are JSX). */
const OFFERING_STYLE: Record<string, { icon: LucideIcon; accent: Accent }> = {
  "drop-off": { icon: Sun, accent: "gold" },
  sports: { icon: Trophy, accent: "emerald" },
  arts: { icon: Palette, accent: "rose" },
  ict: { icon: Laptop, accent: "blue" },
};

const FALLBACK = { icon: Sun, accent: "blue" as Accent };

/**
 * "What we offer", the co-curricular life beyond the Daycare→JHS academic ladder. Sits directly
 * after HomePrograms; a `warm` band keeps the page's alternating tone rhythm (white → warm →
 * brand). Every card is real, client-confirmed content from `SITE.offerings`, no invented
 * facilities or events. Each card carries its own soft accent fill and a slightly-tilted "sticker"
 * icon tile for a playful, school-like feel. No resting or hover shadows on the cards, colour and
 * shape carry the section. The entrance `reveal` lives on the outer article and the small hover
 * animation on the inner card, so the two never fight over `transform` (as HomePrograms does).
 */
export function HomeOfferings() {
  return (
    <Section tone="warm" aria-labelledby="offerings-title">
      <div className="reveal max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--m-brand)]">
          What we offer
        </span>
        <h2
          id="offerings-title"
          className="mt-4 text-[clamp(2rem,7vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance"
        >
          More than lessons — a full day of growing.
        </h2>
        {/* Playful multi-colour underline, a small school-like flourish under the heading. */}
        <span
          aria-hidden="true"
          className="mt-5 flex h-1.5 w-28 gap-1.5"
        >
          <span className="flex-1 rounded-full bg-[#F59E0B]" />
          <span className="flex-1 rounded-full bg-[#10B981]" />
          <span className="flex-1 rounded-full bg-[#F43F5E]" />
          <span className="flex-1 rounded-full bg-[#4169E1]" />
        </span>
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
          Alongside the classroom, children play, create and build real skills — with weekend care
          open to families beyond our own.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6">
        {SITE.offerings.map((offering, i) => {
          const { icon: Icon, accent } = OFFERING_STYLE[offering.key] ?? FALLBACK;
          const t = ACCENT[accent];
          const tilt = i % 2 === 0 ? "-rotate-3" : "rotate-3";
          return (
            <article key={offering.key} className={`reveal${i > 0 ? ` d${Math.min(i, 4)}` : ""}`}>
              <div
                className={`group flex h-full flex-col rounded-[1.75rem] border p-6 transition-transform duration-200 sm:rounded-[2rem] sm:p-8 ${t.card}`}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <span
                    className={`flex size-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br text-white shadow-[0_10px_22px_-10px_rgba(16,24,40,0.55)] ring-2 ring-white transition-transform duration-200 group-hover:rotate-0 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 sm:size-[4.25rem] ${tilt} ${t.tile}`}
                  >
                    <Icon className="size-8" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold leading-tight tracking-[-0.01em] text-balance text-[var(--text)]">
                    {offering.name}
                  </h3>
                </div>

                <p className="mt-5 text-[15px] leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                  {offering.blurb}
                </p>

                <ul className="mt-5 space-y-3">
                  {offering.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[15px] leading-snug font-medium text-[var(--text)] sm:text-base"
                    >
                      <span
                        className={`mt-0.5 flex size-[1.35rem] shrink-0 items-center justify-center rounded-full bg-white ring-1 ${t.ring} ${t.check}`}
                      >
                        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
