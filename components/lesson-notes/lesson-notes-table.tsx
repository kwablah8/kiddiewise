"use client";

import { useMemo, useState } from "react";
import { useAppRouter } from "@/lib/navigation";
import { NotebookText, Paperclip } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLessonNotes } from "@/lib/queries/lesson-notes";
import { useActiveContext, useClasses, useSubjects, useTerms } from "@/lib/queries/academics";
import { useStaff } from "@/lib/queries/academics";
import type { LessonNoteListItemVM } from "@/lib/validators/lesson-notes";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const ALL = "__all__";

/**
 * The admin's read-only view of submitted lesson notes. Drafts never reach this screen, RLS
 * (ln_admin_select) filters them out before the query even runs.
 */
export function LessonNotesTable() {
  const router = useAppRouter();
  const { data: active } = useActiveContext();
  const { data: terms } = useTerms();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: staff } = useStaff();
  const teachers = useMemo(() => (staff ?? []).filter((s) => s.role === "teacher"), [staff]);

  const [termId, setTermId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string>(ALL);
  const [subjectId, setSubjectId] = useState<string>(ALL);
  const [teacherId, setTeacherId] = useState<string>(ALL);

  const effectiveTerm = termId ?? active?.active_term?.id ?? null;

  const filters = useMemo(
    () => ({
      term_id: effectiveTerm ?? undefined,
      class_id: classId === ALL ? undefined : classId,
      subject_id: subjectId === ALL ? undefined : subjectId,
      teacher_id: teacherId === ALL ? undefined : teacherId,
    }),
    [effectiveTerm, classId, subjectId, teacherId],
  );
  const { data, isLoading, isError, refetch } = useLessonNotes(filters);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<LessonNoteListItemVM>[] = [
    {
      key: "week_ending",
      header: "Week ending",
      render: (r) => <span className="text-[var(--muted-foreground)]">{formatDate(r.week_ending)}</span>,
    },
    { key: "class", header: "Class", render: (r) => `${r.class_name} · ${r.subject_name}` },
    { key: "teacher", header: "Teacher", render: (r) => <span className="text-[var(--text)]">{r.teacher_name}</span> },
    {
      key: "topic",
      header: "Topic",
      render: (r) => (
        <span className="flex items-center gap-1.5 truncate text-[var(--text)]">
          {r.topic}
          {r.attachment_name && (
            <Paperclip className="size-3.5 shrink-0 text-[var(--muted-foreground)]" aria-label="Has an attachment" />
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect label="Term" value={effectiveTerm ?? ALL} onChange={(v) => setTermId(v === ALL ? null : v)}
          options={(terms ?? []).map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect label="Class" value={classId} onChange={setClassId}
          options={(classes ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect label="Subject" value={subjectId} onChange={setSubjectId}
          options={(subjects ?? []).map((s) => ({ value: s.id, label: s.name }))} />
        <FilterSelect label="Teacher" value={teacherId} onChange={setTeacherId}
          options={teachers.map((t) => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))} />
      </div>

      <div className={cardShellClass}>
        {isError ? (
          <ErrorState message="Couldn't load lesson notes." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState
            icon={NotebookText}
            title="No lesson notes submitted yet"
            description="Notes teachers submit for their classes will show up here."
          />
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            getRowId={(r) => r.id}
            isLoading={isLoading}
            onRowClick={(r) => router.push(`/lesson-notes/${r.id}`)}
            emptyTitle="No lesson notes submitted yet"
            emptyDescription="Notes teachers submit for their classes will show up here."
          />
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue>{(v: string) => options.find((o) => o.value === v)?.label ?? label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
