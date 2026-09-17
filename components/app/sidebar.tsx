"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FileBarChart2,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  NotebookText,
  PencilLine,
  School,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
  Megaphone,
  NotebookPen,
  UtensilsCrossed,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BrandLock } from "@/components/brand/brand-lock";
import { Crest } from "@/components/brand/crest";
import { UserCard } from "@/components/app/user-card";
import { useSidebarCounts } from "@/lib/queries/sidebar";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { navFocusRingClass } from "@/lib/ui";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: "students" | "staff" | "new_inquiries";
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Academic", href: "/academic", icon: CalendarDays },
  { label: "Students", href: "/students", icon: GraduationCap, countKey: "students" },
  { label: "Staff", href: "/staff", icon: Users, countKey: "staff" },
  { label: "Parents", href: "/parents", icon: UserRound },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Classes", href: "/classes", icon: School },
  { label: "Timetable", href: "/timetable", icon: CalendarClock },
  // Label "Admissions" (per spec) but href "/enquiries" on PURPOSE: the public marketing site owns
  // /admissions, so the admin inquiry module lives at /enquiries. Don't "fix" one to match the other.
  { label: "Enquiries", href: "/enquiries", icon: ClipboardList, countKey: "new_inquiries" },
  { label: "Assessments", href: "/assessments", icon: FileCheck2 },
  { label: "Lesson Notes", href: "/lesson-notes", icon: NotebookText },
  { label: "Canteen", href: "/canteen", icon: UtensilsCrossed },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "Grading", href: "/grading", icon: SlidersHorizontal },
  { label: "Terminal Reports", href: "/terminal-reports", icon: FileBarChart2 },
  { label: "Promotion", href: "/promotion", icon: TrendingUp },
  // Announcements and events live behind this one entry, as two tabs. Both are "tell the school
  // something", and the sidebar is already long.
  { label: "Announcements", href: "/announcements", icon: Megaphone },
];

const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Grade", href: "/teacher/grade", icon: PencilLine },
  { label: "Assessment", href: "/teacher/assessment", icon: ClipboardList },
  { label: "Lesson Notes", href: "/teacher/lesson-notes", icon: NotebookText },
  { label: "Timetable", href: "/teacher/timetable", icon: CalendarClock },
  { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
  { label: "Daily Report", href: "/teacher/daily-report", icon: NotebookPen },
  { label: "Terminal Reports", href: "/teacher/terminal-reports", icon: FileBarChart2 },
];

// Nav list by role. Admin/teacher live here; the M6 parent slice adds its `parent` entry. An unmapped
// role falls back to the admin list (parents can't reach the shell until /parent/* exists).
const NAV_BY_ROLE: Partial<Record<Profile["role"], NavItem[]>> = {
  school_admin: ADMIN_NAV_ITEMS,
  super_admin: ADMIN_NAV_ITEMS,
  teacher: TEACHER_NAV_ITEMS,
};

interface SidebarProps {
  profile: Profile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

export function Sidebar({
  profile,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: counts } = useSidebarCounts();
  const navItems = NAV_BY_ROLE[profile.role] ?? ADMIN_NAV_ITEMS;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[linear-gradient(180deg,var(--brand-top),var(--brand-bottom))]",
        "transition-transform duration-200 lg:translate-x-0",
        collapsed ? "lg:w-20" : "lg:w-64",
        "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Brand block. Collapsed (desktop only): the icon itself expands the sidebar back,
          since there isn't room for a second, separate toggle control next to it. */}
      <div
        className={cn(
          "flex items-center px-5 pt-6 pb-4",
          collapsed ? "lg:justify-center lg:px-3" : "justify-between",
        )}
      >
        <button
          type="button"
          onClick={collapsed ? onToggleCollapsed : undefined}
          aria-label={collapsed ? "Expand sidebar" : undefined}
          disabled={!collapsed}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-md disabled:cursor-default",
            navFocusRingClass,
          )}
        >
          {/* The school's real crest, not a generic mortarboard glyph. Collapsed, the crest alone
              stands in for the lock — and carries its own accessible name, since the wordmark text
              that normally does that job is hidden. */}
          {collapsed ? (
            <Crest tone="light" className="size-8 rounded-lg" sizes="32px" standalone />
          ) : (
            // `compact` drops the descriptor line: at w-64, minus the crest and the collapse
            // chevron, a tracked-out descriptor truncates mid-word, which looks broken. The crest
            // plus the short name is enough identity for app chrome, the full lock has room to
            // breathe on the marketing header and the auth panel.
            <BrandLock tone="light" compact crestClassName="size-8 rounded-lg" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
          className={cn(
            "hidden size-7 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex",
            collapsed && "lg:hidden",
            navFocusRingClass,
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden",
            navFocusRingClass,
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {!collapsed && (
        <p className="px-5 pb-2 text-[11px] font-medium tracking-wider text-white/70 uppercase">
          Main menu
        </p>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const count = item.countKey ? counts?.[item.countKey] : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // `relative` anchors the gold active edge below.
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90",
                navFocusRingClass,
              )}
            >
              {/* Gold edge on the active item, one of only two jobs gold has in the portal (the
                  other is the focus ring). It marks position without relying on the white/15 pill
                  alone, which is a subtle cue on a dark surface. Decorative: `aria-current` on the
                  link is what actually conveys "you are here". */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--m-accent)]"
                />
              )}
              <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {typeof count === "number" && count > 0 && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                      {count}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-white/10" />

      <div className="p-3">
        <UserCard profile={profile} collapsed={collapsed} onSignOut={onSignOut} />
      </div>
    </aside>
  );
}
