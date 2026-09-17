"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TimetableView } from "@/components/timetable/timetable-view";
import { EmptyState } from "@/components/states/empty-state";
import { useTeacherClasses } from "@/lib/queries/teacher";
import { useClassTimetable } from "@/lib/queries/timetable";
import { cardShellClass } from "@/lib/ui";

export function TeacherTimetable({ teacherId }: { teacherId: string }) {
  const { data: classes, isLoading: classesLoading } = useTeacherClasses(teacherId);
  const [classId, setClassId] = useState<string | null>(null);
  const { data: entries, isLoading, isError, refetch } = useClassTimetable(classId ?? "");

  return (
    <div className="space-y-4">
      <div className="w-56 space-y-1.5">
        <Label>Class</Label>
        <Select value={classId ?? undefined} onValueChange={setClassId} disabled={classesLoading}>
          <SelectTrigger>
            <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"}>
              {(v: string) => (classes ?? []).find((c) => c.id === v)?.name ?? "Select a class"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(classes ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!classId ? (
        <div className={cardShellClass}>
          <EmptyState title="Select a class" description="Choose one of your classes to see its timetable." />
        </div>
      ) : (
        <TimetableView entries={entries} isLoading={isLoading} isError={isError} onRetry={refetch} />
      )}
    </div>
  );
}
