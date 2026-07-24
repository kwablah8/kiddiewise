import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChildSummaryVM } from "@/lib/validators/parent";
import { formatInitials } from "@/lib/format";
import { cardShellClass, lightFocusRingClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** A tappable child card. attendance %/latest result show a gentle placeholder until Slices 2–3
 *  wire that data. */
export function ChildCard({ child }: { child: ChildSummaryVM }) {
  const name = `${child.first_name} ${child.last_name}`;
  return (
    <Link
      href={`/parent/children/${child.id}`}
      className={cn(
        cardShellClass,
        "group flex items-center gap-4 transition-shadow hover:shadow-md",
        lightFocusRingClass,
      )}
    >
      <Avatar className="size-12 shrink-0">
        {child.photo_url && <AvatarImage src={child.photo_url} alt={name} />}
        <AvatarFallback className="bg-[var(--bg)] text-sm font-medium text-[var(--text)]">
          {formatInitials(child.first_name, child.last_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--text)]">{name}</p>
        <p className="truncate text-sm text-[var(--muted-foreground)]">
          {child.class_name ?? "No class yet"}
          {" · "}
          {child.attendance_pct !== null
            ? `${child.attendance_pct}% attendance`
            : "Attendance coming soon"}
        </p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
