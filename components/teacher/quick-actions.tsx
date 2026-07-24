import Link from "next/link";
import { ArrowRight, CalendarCheck, PencilLine, FileCheck2, ClipboardList, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardShellClass, lightFocusRingClass } from "@/lib/ui";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

// Exam + Assessment both point at /teacher/assessment — the assessment screen (Slice 3) hosts exam
// creation and performance review together (01-REQ Teacher §Exams & assessments).
const ACTIONS: QuickAction[] = [
  { title: "Attendance", description: "Mark today's register", href: "/teacher/attendance", icon: CalendarCheck },
  { title: "Grade", description: "Enter and submit results", href: "/teacher/grade", icon: PencilLine },
  { title: "Exam", description: "Create and grade exams", href: "/teacher/assessment", icon: FileCheck2 },
  { title: "Assessment", description: "Review student performance", href: "/teacher/assessment", icon: ClipboardList },
];

/** Labelled row of action cards (06-UI §5 "Quick actions"). */
export function QuickActions() {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">Quick actions</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className={cn(
              cardShellClass,
              "group flex items-center gap-3 transition-colors hover:border-[var(--primary)]",
              lightFocusRingClass,
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--info-bg)] text-[var(--info-fg)]">
              <a.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--text)]">{a.title}</span>
              <span className="block truncate text-xs text-[var(--muted-foreground)]">{a.description}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
