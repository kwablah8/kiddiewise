"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useAssessment } from "@/lib/queries/assessments";
import type { AssessmentResultVM } from "@/lib/validators/assessments";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const resultColumns: DataTableColumn<AssessmentResultVM>[] = [
  { key: "admission_no", header: "Admission No.", render: (r) => <span className="font-medium">{r.admission_no}</span> },
  { key: "name", header: "Student", render: (r) => <span className="text-[var(--text)]">{r.student_name}</span> },
  { key: "score", header: "Score", align: "right", render: (r) => r.score },
  { key: "grade", header: "Grade", render: (r) => r.grade ?? <span className="text-[var(--muted-foreground)]">—</span> },
  { key: "remark", header: "Remark", render: (r) => <span className="text-[var(--muted-foreground)]">{r.remark ?? "—"}</span> },
];

export function AssessmentDetail({ id, backHref = "/assessments" }: { id: string; backHref?: string }) {
  const { data, isLoading, isError, refetch } = useAssessment(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment" />
        <div className={cn(cardShellClass, "space-y-3")}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment" />
        <div className={cardShellClass}><ErrorState message="Couldn't load this assessment." onRetry={() => refetch()} /></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assessment not found"
          action={<Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>Back to Assessments</Link>} />
        <div className={cardShellClass}>
          <EmptyState icon={FileQuestion} title="Assessment not found"
            description="This assessment may have been removed, or the link is incorrect." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.title}
        subtitle={`${data.class_name} · ${data.subject_name} · ${data.type_name} · ${data.term_name}`}
        backHref={backHref}
        backLabel="Assessments"
        action={data.is_submitted ? <StatusPill label="Submitted" tone="success" /> : <StatusPill label="Not submitted" tone="neutral" />}
      />
      <div className={cardShellClass}>
        <dl className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Max score" value={String(data.max_score)} />
          <Field label="Date" value={data.date ? formatDate(data.date) : "—"} />
          <Field label="Results" value={String(data.result_count)} />
          <Field label="Term" value={data.term_name} />
        </dl>
        <DataTable columns={resultColumns} data={data.results} getRowId={(r) => r.student_id} pageSize={12}
          emptyTitle="No results yet" emptyDescription="Scores submitted by the teacher will appear here." />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--text)]">{value}</dd>
    </div>
  );
}
