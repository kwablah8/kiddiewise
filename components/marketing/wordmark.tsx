import { BrandLock } from "@/components/brand/brand-lock";

interface WordmarkProps {
  /** "light" for dark (blue) surfaces — header/footer bands, "dark" for the white header/menu. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * The marketing site's identity mark — crest in a white chip beside the wordmark text.
 *
 * Now a thin alias over the shared `BrandLock`: the crest markup and the "SLIS / Learners
 * International" pairing moved to `components/brand/` once the portal sidebar, auth screens and
 * parent shell started showing the same lock, so the surfaces cannot drift. Kept under this name
 * because every marketing call site already imports `Wordmark`.
 */
export function Wordmark({ tone = "dark", className }: WordmarkProps) {
  return <BrandLock tone={tone} className={className} />;
}
