"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { StatusControl } from "./status-control";
import { cardShellClass } from "@/lib/ui";
import { useTeacherClasses } from "@/lib/queries/teacher";
import { useRoster, useSaveAttendance } from "@/lib/queries/attendance";
import type { AttendanceStatus } from "@/lib/validators/attendance";

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function AttendanceMarker({ teacherId }: { teacherId: string }) {
  const { data: classes, isLoading: classesLoading } = useTeacherClasses(teacherId);
  const [classId, setClassId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  // Edit overrides for the current class+date only; cleared whenever class or date changes. The shown
  // status is `pending[id] ?? entry.status` (the loaded roster is the base) — no effect needed.
  const [pending, setPending] = useState<Record<string, AttendanceStatus>>({});

  const { data: roster, isLoading, isError, refetch } = useRoster(classId, date);
  const save = useSaveAttendance();

  const entries = roster?.entries ?? [];
  const statusOf = (studentId: string, base: AttendanceStatus | null): AttendanceStatus | null =>
    pending[studentId] ?? base;
  const markedCount = entries.filter((e) => statusOf(e.student_id, e.status) !== null).length;

  function changeClass(next: string | null) {
    setClassId(next);
    setPending({});
  }
  function changeDate(next: string) {
    setDate(next);
    setPending({});
  }
  function setStatus(studentId: string, status: AttendanceStatus) {
    setPending((p) => ({ ...p, [studentId]: status }));
  }
  function markAllPresent() {
    setPending(Object.fromEntries(entries.map((e) => [e.student_id, "present" as AttendanceStatus])));
  }

  async function onSave() {
    if (!classId) return;
    const payload = entries
      .map((e) => ({ student_id: e.student_id, status: statusOf(e.student_id, e.status) }))
      .filter((x): x is { student_id: string; status: AttendanceStatus } => x.status !== null);
    if (payload.length === 0) return;
    try {
      const res = await save.mutateAsync({ class_id: classId, date, entries: payload });
      toast.success(`Attendance saved for ${res.count} student${res.count === 1 ? "" : "s"}.`);
    } catch {
      toast.error("Couldn't save attendance. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={changeClass} disabled={classesLoading}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"}>
                {(v: string) => {
                  if (classesLoading) return "Loading classes…";
                  const c = (classes ?? []).find((x) => x.id === v);
                  return c ? `${c.name} · ${c.level}` : "Select a class";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-date">Date</Label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Roster */}
      {!classId ? (
        <div className={cardShellClass}>
          <EmptyState title="Select a class and date" description="Choose a class to take attendance." />
        </div>
      ) : isError ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load the roster." onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className={cardShellClass}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className={cardShellClass}>
          <EmptyState
            title="No students in this class"
            description="Add students to this class to take attendance."
          />
        </div>
      ) : (
        <div className={cardShellClass}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {markedCount} of {entries.length} marked
            </p>
            <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
              Mark all present
            </Button>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {entries.map((e) => (
              <li key={e.student_id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--text)]">
                    {e.first_name} {e.last_name}
                  </span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{e.admission_no}</span>
                </span>
                <StatusControl
                  value={statusOf(e.student_id, e.status)}
                  onChange={(s) => setStatus(e.student_id, s)}
                />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onSave} disabled={save.isPending || markedCount === 0}>
              {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
