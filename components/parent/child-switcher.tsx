"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParentChildren } from "@/lib/queries/parent";

// Reads the active child id from /parent/children/[id] paths (undefined on the dashboard).
function activeChildId(pathname: string): string | undefined {
  const m = /^\/parent\/children\/([^/]+)/.exec(pathname);
  return m ? m[1] : undefined;
}

/** Top-bar child switcher. Selecting a child drills into their pages. Hidden until there are
 *  children to switch between. */
export function ChildSwitcher() {
  const router = useRouter();
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
      <SelectTrigger aria-label="Choose a child" className="h-9 min-w-44">
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
