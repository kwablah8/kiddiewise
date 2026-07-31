"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AssessmentRowActions } from "./assessment-row-actions";
import { useAssessments } from "@/lib/queries/assessments";
import { useActiveContext, useClasses, useSubjects, useTerms } from "@/lib/queries/academics";
import type { AssessmentListItemVM } from "@/lib/validators/assessments";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";

const ALL = "__all__";

export function AssessmentsTable() {
  const router = useRouter();
  const { data: active } = useActiveContext();
  const { data: terms } = useTerms();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();

  const [termId, setTermId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string>(ALL);
  const [subjectId, setSubjectId] = useState<string>(ALL);

  // Default to the active term until the admin picks one (derived, no effect).
  const effectiveTerm = termId ?? active?.active_term?.id ?? null;

  const filters = useMemo(
    () => ({
      term_id: effectiveTerm ?? undefined,
      class_id: classId === ALL ? undefined : classId,
      subject_id: subjectId === ALL ? undefined : subjectId,
    }),
    [effectiveTerm, classId, subjectId],
  );
  const { data, isLoading, isError, refetch } = useAssessments(filters);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  const columns: DataTableColumn<AssessmentListItemVM>[] = [
    { key: "class", header: "Class", render: (r) => <span className="font-medium text-[var(--text)]">{r.class_name}</span> },
    { key: "subject", header: "Subject", render: (r) => r.subject_name },
    {
      key: "assessment",
      header: "Assessment",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[var(--text)]">{r.title}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{r.type_name}</p>
        </div>
      ),
    },
    { key: "max", header: "Max", align: "right", render: (r) => r.max_score },
    { key: "date", header: "Date", render: (r) => r.date ? <span className="text-[var(--muted-foreground)]">{formatDate(r.date)}</span> : <span className="text-[var(--muted-foreground)]">—</span> },
    {
      key: "results",
      header: "Results",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">{r.result_count}</span>
          {r.is_submitted && <StatusPill label="Submitted" tone="success" />}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => <AssessmentRowActions assessment={r} />,
    },
  ];

  return (
    <div className={cardShellClass}>
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Term" value={effectiveTerm ?? ALL} onChange={(v) => setTermId(v === ALL ? null : v)}
          options={[{ value: ALL, label: "All terms" }, ...(terms ?? []).map((t) => ({ value: t.id, label: t.name }))]} />
        <FilterSelect label="Class" value={classId} onChange={setClassId}
          options={[{ value: ALL, label: "All classes" }, ...(classes ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
        <FilterSelect label="Subject" value={subjectId} onChange={setSubjectId}
          options={[{ value: ALL, label: "All subjects" }, ...(subjects ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
      </div>

      <div className="mt-4">
        {isError ? (
          <ErrorState message="Couldn't load assessments." onRetry={() => refetch()} />
        ) : isEmpty ? (
          <EmptyState icon={FileCheck2} title="No assessments"
            description="No assessments match these filters yet. Teachers' submitted assessments will appear here." />
        ) : (
          <DataTable columns={columns} data={data ?? []} getRowId={(r) => r.id} isLoading={isLoading}
            onRowClick={(r) => router.push(`/assessments/${r.id}`)}
            emptyTitle="No assessments" emptyDescription="Try different filters." />
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--muted-foreground)]">{label}</label>
      {/* base-ui's onValueChange is `(value: string | null, …) => void` (null on clear) — this
          Select is never rendered with a clear affordance, but the callback still has to accept
          it; falling back to the sentinel keeps FilterSelect's own `onChange: (v: string) => void`
          contract simple for its three call sites. */}
      <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue>{(v: string) => options.find((o) => o.value === v)?.label ?? label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
