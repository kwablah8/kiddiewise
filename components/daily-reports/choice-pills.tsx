"use client";

import { cn } from "@/lib/utils";

/**
 * One-tap choice pills for the daily report's little questions ("Child slept: Good / Ok / Not
 * well"). A dropdown hides three options behind two taps and a scrim; on a form a parent fills
 * every single morning, the options belong on the surface. Tapping the selected pill again clears
 * it, "not answered" is a valid state on this form and must stay reachable.
 */
export function ChoicePills<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T | null;
  onChange: (v: T | null) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : o.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
              selected
                ? "border-transparent bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The same pills for yes/no questions, so booleans and enums read as one control family. */
export function YesNoPills({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  ariaLabel: string;
}) {
  return (
    <ChoicePills
      ariaLabel={ariaLabel}
      value={value === null ? null : value ? "yes" : "no"}
      onChange={(v) => onChange(v === null ? null : v === "yes")}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
    />
  );
}

/** Multi-select chips, the teacher's "Today's activities" list. */
export function ToggleChips<T extends string>({
  values,
  onChange,
  options,
  ariaLabel,
}: {
  values: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])
            }
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
              selected
                ? "border-transparent bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
