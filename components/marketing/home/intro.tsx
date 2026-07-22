import { Section } from "@/components/marketing/section";
import { PhotoSlot } from "@/components/marketing/photo-slot";

export function HomeIntro() {
  return (
    <Section tone="warm" aria-labelledby="intro-title">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="reveal">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
            Welcome
          </span>
          <h2
            id="intro-title"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
          >
            A school that feels like a home on the hill.
          </h2>

          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[var(--muted-foreground)]">
            <p>
              Kwahu Ridge sits where the air is cooler and the pace is kinder — a campus built
              around a simple idea: children learn best when they feel known.
            </p>
            <p>
              From your child&apos;s first morning in Early Years to the day they sit the WASSCE,
              the same people watch them grow. We keep classes small, expectations high, and the
              door to the head&apos;s office genuinely open.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            {/* SEAM: real photo later */}
            <PhotoSlot
              label="Portrait of the Head of School"
              aspect="1 / 1"
              tone="green"
              symbol="dwennimmen"
              hideCaption
              className="size-14 shrink-0 rounded-2xl"
            />
            <div>
              <p className="font-medium text-[var(--text)]">Mrs. Abena Owusu-Ansah</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Head of School
              </p>
            </div>
          </div>
        </div>

        <div className="reveal d1">
          {/* SEAM: real photo later */}
          <PhotoSlot
            label="The main quad on a cool Kwahu morning, students arriving for the day"
            aspect="5 / 6"
            tone="neutral"
            symbol="fihankra"
            className="shadow-xl"
          />
        </div>
      </div>
    </Section>
  );
}
