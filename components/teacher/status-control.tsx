"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/validators/attendance";

const OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
];

const activeClass: Record<AttendanceStatus, string> = {
  present: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  absent: "bg-[color-mix(in_srgb,var(--danger)_12%,white)] text-[var(--danger)]",
  late: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
};

export function StatusControl({
  value,
  onChange,
}: {
  value: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="group">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            value === o.value
              ? activeClass[o.value]
              : "text-[var(--muted-foreground)] hover:text-[var(--text)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
