import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const ctaVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        // Forest-green primary — the main action; reads on both dark bands and the light header.
        // No solid ring-offset color (it would print a white "collar" on the maroon/transparent
        // header contexts) — the offset is transparent, and the ring itself is lightened a touch
        // so it clears 3:1 against both the maroon band and the light scrolled header.
        primary:
          "bg-[var(--primary)] text-white shadow-sm hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] hover:shadow-md focus-visible:ring-[color-mix(in_srgb,var(--primary),white_18%)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // White solid — the strong action when it sits on a green or maroon band.
        "solid-light":
          "bg-white text-[var(--primary)] shadow-sm hover:bg-white/90 hover:shadow-md focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // Outlined light — a quiet secondary on maroon/green bands.
        "ghost-on-maroon":
          "border border-white/30 text-white hover:border-white/60 hover:bg-white/10 focus-visible:ring-white",
        // Outlined dark — a quiet secondary on white/warm bands.
        "outline-dark":
          "border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--text)]/25 hover:bg-black/[0.03] focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      },
      size: {
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[0.95rem] sm:text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface CtaButtonProps extends VariantProps<typeof ctaVariants> {
  href: string;
  children: React.ReactNode;
  withArrow?: boolean;
  className?: string;
  onClick?: () => void;
}

/** Marketing call-to-action. Renders a Next link internally, a plain anchor for external URLs. */
export function CtaButton({
  href,
  children,
  variant,
  size,
  withArrow = false,
  className,
  onClick,
}: CtaButtonProps) {
  const classes = cn(ctaVariants({ variant, size }), className);
  const content = (
    <>
      {children}
      {withArrow ? (
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  );
}
