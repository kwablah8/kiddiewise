"use client";

import { usePathname } from "next/navigation";
import { useAppRouter } from "@/lib/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParentChildren } from "@/lib/queries/parent";
import { cn } from "@/lib/utils";

// Reads the active child id from /parent/children/[id] paths (undefined on the dashboard).
/**
 * Returns `null`, not `undefined`, when no child is in the path (e.g. on /parent/dashboard).
 *
 * Base UI decides on first render whether a Select is controlled, and treats any value that is not
 * `undefined` as controlled. Returning `undefined` here made the switcher start uncontrolled and then
 * flip to controlled on navigating to a child — which logged a React warning on every parent page.
 */
function activeChildId(pathname: string): string | null {
  const m = /^\/parent\/children\/([^/]+)/.exec(pathname);
  return m ? m[1]! : null;
}

/** Top-bar child switcher. Selecting a child drills into their pages. Hidden until there are
 *  children to switch between. `className` is merged into the trigger (e.g. `w-full` on mobile). */
export function ChildSwitcher({ className }: { className?: string }) {
  const router = useAppRouter();
  const pathname = usePathname();
  const { data } = useParentChildren();
  const children = data ?? [];

  if (children.length === 0) return null;

  // Maps each id → display name so the trigger shows "Kwame Asante", not the raw "stu-01".
  const items = Object.fromEntries(children.map((c) => [c.id, `${c.first_name} ${c.last_name}`]));

  return (
    <Select
      value={activeChildId(pathname)}
      items={items}
      onValueChange={(id) => {
        if (typeof id === "string") router.push(`/parent/children/${id}`);
      }}
    >
      <SelectTrigger aria-label="Choose a child" className={cn("h-9 min-w-44", className)}>
        <SelectValue placeholder="View a child" />
      </SelectTrigger>
      <SelectContent>
        {children.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.first_name} {c.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
