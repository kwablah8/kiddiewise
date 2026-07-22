import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const ctaVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        // Gold — the primary SLIS conversion action. Dark-navy ink on gold reads 11.3:1, and the
        // navy focus ring stays visible on gold (a gold ring would vanish). Transparent ring
        // offset so it never prints a white collar over the blue hero / scrolled header.
        gold:
          "bg-[var(--m-accent)] text-[var(--m-accent-ink)] shadow-sm hover:bg-[color-mix(in_srgb,var(--m-accent),black_8%)] hover:shadow-md focus-visible:ring-[var(--m-accent-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // Royal-blue solid — a strong action on white / warm bands.
        brand:
          "bg-[var(--m-brand)] text-white shadow-sm hover:bg-[var(--m-brand-deep)] hover:shadow-md focus-visible:ring-[color-mix(in_srgb,var(--m-brand),white_25%)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // White solid — the strong action sitting on a blue band.
        "solid-light":
          "bg-white text-[var(--m-brand)] shadow-sm hover:bg-white/90 hover:shadow-md focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // Outlined light — a quiet secondary on blue / dark bands.
        "ghost-light":
          "border border-white/35 text-white hover:border-white/70 hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        // Outlined dark — a quiet secondary on white / warm bands.
        "outline-dark":
          "border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[color-mix(in_srgb,var(--m-brand),white_40%)] hover:bg-[color-mix(in_srgb,var(--m-brand),transparent_96%)] focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      },
      size: {
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[0.95rem] sm:text-base",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
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
