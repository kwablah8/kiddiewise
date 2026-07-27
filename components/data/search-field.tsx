"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The search box above a list.
 *
 * Extracted from the students table, which had the only one, so the other eight lists could gain
 * search without each re-inventing the icon offset and the input height. One implementation also
 * means one place to fix the affordance — an admin should recognise it instantly on every screen
 * rather than hunting for wherever that particular table put its filter.
 *
 * Presentational only: it holds no state and does no filtering. Callers decide whether the query
 * filters rows in the browser (`lib/search.ts`) or is passed to the server, which is what lets the
 * students list keep its debounced server-side search while the rest filter locally.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name. Required — "Search" alone is useless when a page has more than one list. */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 pl-8"
      />
    </div>
  );
}
