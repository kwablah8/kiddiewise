"use client";

import { useState } from "react";
import { ChevronRight, NotebookPen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReportViewDialog } from "@/components/daily-reports/report-view-dialog";
import { useClasses } from "@/lib/queries/academics";
import { useClassDailyStatus } from "@/lib/queries/daily-reports";
import type { DailyStatusRowVM } from "@/lib/validators/daily-reports";
import { cardShellClass } from "@/lib/ui";

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * The admin's record-keeping view of daily reports: pick a class and day, see who has and hasn't
 * submitted from each side, open a child to read both. Read-only throughout — drp_admin/drt_admin
 * (migration 0026) already give the admin full access to every row in the school, this is simply
 * the first screen that surfaces it; nothing here writes.
 */
export function AdminDailyReports() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [classId, setClassId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [openStudent, setOpenStudent] = useState<DailyStatusRowVM | null>(null);

  const { data: rows, isLoading, isError, refetch } = useClassDailyStatus(classId, date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId} disabled={classesLoading}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"}>
                {(v: string) => {
                  if (classesLoading) return "Loading classes…";
                  const c = (classes ?? []).find((x) => x.id === v);
                  return c ? `${c.name}` : "Select a class";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adr-date">Date</Label>
          <Input id="adr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
      </div>

      {!classId ? (
        <div className={cardShellClass}>
          <EmptyState icon={NotebookPen} title="Select a class and date"
            description="Choose a class to see each child's daily report." />
        </div>
      ) : isError ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load the class list." onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className={cardShellClass}>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-12 w-full" />)}
          </div>
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className={cardShellClass}>
          <EmptyState icon={NotebookPen} title="No students enrolled"
            description="This class has no active students for the current academic year." />
        </div>
      ) : (
        <div className={cardShellClass}>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((r) => (
              <li key={r.student_id}>
                <button
                  type="button"
                  onClick={() => setOpenStudent(r)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{r.student_name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{r.admission_no}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusPill label={r.parent_submitted ? "Parent ✓" : "Parent —"} tone={r.parent_submitted ? "success" : "neutral"} />
                    <StatusPill label={r.teacher_submitted ? "Teacher ✓" : "Teacher —"} tone={r.teacher_submitted ? "success" : "neutral"} />
                    <ChevronRight className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openStudent && (
        <ReportViewDialog
          key={`${openStudent.student_id}-${date}`}
          student={openStudent}
          date={date}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}
