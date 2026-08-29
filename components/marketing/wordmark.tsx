import { BrandLock } from "@/components/brand/brand-lock";

interface WordmarkProps {
  /** "light" for dark (blue) surfaces, header/footer bands, "dark" for the white header/menu. */
  tone?: "light" | "dark";
  className?: string;
  /** Spell the school out instead of showing the initialism. See `BrandLock`. */
  name?: "short" | "full";
}

/**
 * The marketing site's identity mark, crest in a white chip beside the wordmark text.
 *
 * Now a thin alias over the shared `BrandLock`: the crest markup and the short-name/descriptor
 * pairing moved to `components/brand/` once the portal sidebar, auth screens and parent shell
 * started showing the same lock, so the surfaces cannot drift. Kept under this name because every
 * marketing call site already imports `Wordmark`.
 */
export function Wordmark({ tone = "dark", className, name }: WordmarkProps) {
  return <BrandLock tone={tone} className={className} name={name} />;
}
