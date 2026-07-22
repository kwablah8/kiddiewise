import { cn } from "@/lib/utils";

/**
 * Adinkra — the marketing site's signature iconography.
 *
 * Adinkra are traditional Akan (Ghanaian) symbols, each carrying a proverb. Using them as the
 * content icon language — instead of generic stock glyphs — is what roots this school site in
 * its own place. These are clean, simplified geometric interpretations drawn as single-stroke
 * line-art (they read as a consistent hand, not museum reproductions); each usage pairs the mark
 * with its name + meaning in text, so the symbols carry information rather than decorate.
 *
 * Purely decorative in the DOM (aria-hidden) — the adjacent visible label is the accessible name.
 * Colour follows `currentColor`, so a mark inherits whatever token its container sets.
 */

export type AdinkraName =
  | "nyansapo"
  | "sankofa"
  | "dwennimmen"
  | "nkyinkyim"
  | "fihankra"
  | "aya";

/** Human-facing name + one-line meaning, shown beside the mark as the "utility voice" caption. */
export const ADINKRA_MEANING: Record<AdinkraName, { name: string; meaning: string }> = {
  nyansapo: { name: "Nyansapɔ", meaning: "wisdom & the patience to learn" },
  sankofa: { name: "Sankɔfa", meaning: "know your roots, reach forward" },
  dwennimmen: { name: "Dwennimmen", meaning: "strength held with humility" },
  nkyinkyim: { name: "Nkyinkyim", meaning: "learning is a winding journey" },
  fihankra: { name: "Fihankra", meaning: "safety, belonging, a home" },
  aya: { name: "Aya", meaning: "endurance & resourcefulness" },
};

const PATHS: Record<AdinkraName, React.ReactNode> = {
  // Wisdom knot — four interlaced loops meeting at the centre.
  nyansapo: (
    <>
      <ellipse cx="24" cy="15" rx="6" ry="9" />
      <ellipse cx="24" cy="33" rx="6" ry="9" />
      <ellipse cx="15" cy="24" rx="9" ry="6" />
      <ellipse cx="33" cy="24" rx="9" ry="6" />
    </>
  ),
  // Heart form of Sankofa, with an inner curl looking back on itself.
  sankofa: (
    <>
      <path d="M24 41C6 28 12 13 24 22 36 13 42 28 24 41Z" />
      <path d="M24 33c-4-2-4-8 0-8" />
    </>
  ),
  // Ram's horns — two mirrored curls rising from a shared base.
  dwennimmen: (
    <>
      <path d="M24 32C12 32 9 15 20 15c6 0 6 9 0 9" />
      <path d="M24 32c12 0 15-17 4-17-6 0-6 9 0 9" />
    </>
  ),
  // Twisting — a rounded meander that keeps changing direction.
  nkyinkyim: <path d="M9 13h11v11h8v11h11" strokeWidth="3" />,
  // A walled compound with a gateway, an inner room at its heart.
  fihankra: (
    <>
      <path d="M22 36H12V12h24v24h-9" />
      <rect x="18" y="20" width="12" height="11" rx="1.5" />
    </>
  ),
  // Fern — a central stalk with symmetric fronds.
  aya: (
    <>
      <path d="M24 42C24 30 24 18 24 8" />
      <path d="M24 34 14 30M24 27 15 24M24 20 17 18M24 14 20 12" />
      <path d="M24 34 34 30M24 27 33 24M24 20 31 18M24 14 28 12" />
    </>
  ),
};

interface AdinkraProps {
  name: AdinkraName;
  className?: string;
}

export function Adinkra({ name, className }: AdinkraProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
