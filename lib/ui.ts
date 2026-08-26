/**
 * Shared class-name constants for the app shell / data-display components (06-UI-UX-STANDARDS.md).
 * Keeping these in one place avoids re-copying the same literal across cards and nav chrome.
 */

/** Card shell: rounded surface, hairline border, soft shadow (06-UI §4/§6). */
export const cardShellClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

/**
 * Visible focus ring for hand-rolled interactive chrome on the dark navy sidebar (06-UI §11).
 *
 * Gold rather than white: it reads 9.09:1 on the sidebar's top navy and 13.22:1 on its bottom, so
 * it is more visible than the white/70 it replaced and it is the brand accent, the keyboard path
 * through the app is one of the few places a focus ring gets to carry identity.
 */
export const navFocusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-accent)] focus-visible:ring-offset-0";

/** Visible focus ring for hand-rolled interactive chrome on light surfaces (06-UI §11). */
export const lightFocusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";
