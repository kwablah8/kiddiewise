"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

import { ChildTabs } from "@/components/parent/child-tabs";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useChildResults, useChildReport } from "@/lib/queries/parent";
import { performanceBand } from "@/lib/grading";
import type { ChildResultsVM, TerminalReportVM } from "@/lib/validators/parent";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ChildResults({ id }: { id: string }) {
  const results = useChildResults(id);
  const report = useChildReport(id);

  const isLoading = results.isLoading;
  const isError = results.isError;
  const subjects = results.data?.subjects ?? [];
  const isEmpty = !isLoading && !isError && subjects.length === 0;

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      {isLoading && (
        <div className="space-y-4">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load results." onRetry={() => results.refetch()} />
        </div>
      )}

      {isEmpty && (
        <div className={cardShellClass}>
          <EmptyState
            title="No results published yet"
            description="Your child's results for this term will appear here once teachers submit them."
          />
        </div>
      )}

      {!isLoading && !isError && !isEmpty && results.data && (
        <>
          {report.data ? (
            <ReportCard report={report.data} />
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              The terminal report for this term hasn&apos;t been published yet.
            </p>
          )}
          <ResultsTable data={results.data} />
        </>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: TerminalReportVM }) {
  function handleDownload() {
    // SEAM: real path streams/downloads the generated report PDF from Storage.
    toast.success("Report ready", {
      description: `${report.term_name} terminal report — your download will start shortly.`,
    });
  }

  return (
    <div className={cn(cardShellClass, "flex flex-wrap items-start justify-between gap-4")}>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
          Terminal report
        </p>
        <p className="mt-1 text-base font-semibold text-[var(--text)]">{report.term_name}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Overall: {report.overall_average !== null ? `${report.overall_average}%` : "—"}
          {report.overall_grade ? ` · Grade ${report.overall_grade}` : ""}
        </p>
        {report.class_teacher_remark && (
          <p className="mt-2 max-w-xl text-sm text-[var(--text)] italic">
            &ldquo;{report.class_teacher_remark}&rdquo;
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        className="w-full sm:w-auto"
      >
        <Download className="size-4" aria-hidden="true" />
        View / Download
      </Button>
    </div>
  );
}

function ResultsTable({ data }: { data: ChildResultsVM }) {
  return (
    <div className={cn(cardShellClass, "space-y-4")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Results</h2>
        <span className="text-sm text-[var(--muted-foreground)]">{data.term_name}</span>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {data.subjects.map((s) => (
          <li key={s.subject} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium text-[var(--text)]">{s.subject}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">{s.score}%</span>
                <StatusPill label={s.grade} tone={performanceBand(s.score).tone} />
              </span>
            </div>
            {s.teacher_comment && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.teacher_comment}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
