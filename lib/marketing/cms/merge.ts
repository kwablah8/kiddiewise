import { admissionsNoteFor, type SiteConfig } from "@/lib/marketing/site";
import type { CmsSiteSettings, PortableText } from "@/lib/validators/marketing";

/**
 * Folds the school's Studio edits over the committed config.
 *
 * Pure and dependency-free so the whole fallback policy is unit-testable without a network, a database
 * or a Sanity project, which matters, because this function is the only thing standing between an
 * editor clearing a field and the public site rendering a blank.
 *
 * THE RULES, and why each one:
 *
 * - **Scalars fall back per field.** An editor who fills in the email but has not written an early-bird
 *   sentence yet should get the shipped sentence, not lose the email too. Whitespace counts as empty,
 *   because "  " in a text box is what a half-hearted edit actually looks like.
 * - **Arrays replace wholesale, never element-wise.** A non-empty list from Sanity wins entirely; an
 *   empty or absent one falls back entirely. Index-wise merging is how you get "the editor deleted the
 *   second phone number and the third inherited the second's value".
 * - **`admissionsNote` is derived, never merged.** It is computed from whichever `admissionsYear` won,
 *   so the note can never disagree with the year.
 */

/** Trimmed, or `null` if the value was absent or only whitespace. */
function text(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** The array if it has at least one entry, otherwise `null`, the "wholesale" half of the rule above. */
function list<T>(value: readonly T[] | null | undefined): readonly T[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value;
}

/**
 * The marketing config as the site should render it: `SiteConfig` plus the one editable field that has
 * no equivalent in the committed config, because no committed copy exists for it.
 */
export interface MarketingSettings extends SiteConfig {
  /** The About page's founding story. `null` keeps the existing "school to confirm" placeholder. */
  foundingStory: PortableText | null;
}

export function mergeSiteSettings(
  fallback: SiteConfig,
  cms: CmsSiteSettings | null,
): MarketingSettings {
  if (!cms) return { ...fallback, foundingStory: null };

  const phones = list(cms.phones)?.map((phone) => phone.trim()).filter((phone) => phone.length > 0);
  const hoursEntries = list(cms.hoursEntries);
  const admissionsYear = text(cms.admissionsYear) ?? fallback.admissionsYear;

  return {
    ...fallback,
    contact: {
      email: text(cms.contactEmail) ?? fallback.contact.email,
      phones: phones && phones.length > 0 ? phones : fallback.contact.phones,
    },
    hours: {
      entries: hoursEntries ?? fallback.hours.entries,
      // `hoursNote` is genuinely optional in the design, the note element is not rendered when it is
      // absent, so an unset note falls back to the shipped one rather than to empty string.
      note: text(cms.hoursNote) ?? fallback.hours.note,
    },
    admissionsYear,
    admissionsNote: admissionsNoteFor(admissionsYear),
    earlyBird: text(cms.earlyBird) ?? fallback.earlyBird,
    foundingStory: cms.foundingStory && cms.foundingStory.length > 0 ? cms.foundingStory : null,
  };
}
