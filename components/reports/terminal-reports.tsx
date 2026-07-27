"use client";

import { useState } from "react";
import { FileText, Loader2, MessageSquare } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { cardShellClass } from "@/lib/ui";
import { useClasses, useTerms } from "@/lib/queries/academics";
import {
  useReportSheet,
  useGenerateReports,
  useSetReportsPublished,
} from "@/lib/queries/reports";
import { ReportCommentsDialog } from "./report-comments-dialog";
import { ReopeningDateBanner } from "./reopening-date-banner";
import type { TerminalReportRowVM } from "@/lib/validators/reports";

/**
 * Terminal reports for a class and term.
 *
 * Three distinct steps, deliberately not one button: generate the snapshot, review and comment on it,
 * then publish it to parents. Collapsing them would mean a mid-term regeneration silently pushes
 * half-marked results onto report cards parents are already reading.
 */
export function TerminalReports() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: terms, isLoading: termsLoading } = useTerms();
  const [classId, setClassId] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);
  const [commenting, setCommenting] = useState<TerminalReportRowVM | null>(null);

  const { data: sheet, isLoading, isError, refetch } = useReportSheet(classId, termId);
  const generate = useGenerateReports();
  const publish = useSetReportsPublished();

  const selectedTerm = (terms ?? []).find((t) => t.id === termId) ?? null;
  const rows = sheet?.rows ?? [];
  const allPublished = rows.length > 0 && sheet?.published_count === sheet?.generated_count && (sheet?.generated_count ?? 0) > 0;

  async function onGenerate() {
    if (!classId || !termId) return;
    try {
      const res = await generate.mutateAsync({ class_id: classId, term_id: termId });
      toast.success(`${res.generated} report${res.generated === 1 ? "" : "s"} generated.`, {
        // Surfaced rather than swallowed: an unmarked student on a report card is the thing an admin
        // most needs to know before publishing.
        description:
          res.skipped > 0
            ? `${res.skipped} student${res.skipped === 1 ? " has" : "s have"} no submitted marks yet.`
            : "Review the figures, add comments, then publish.",
      });
    } catch (err) {
      toast.error("Couldn't generate reports", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  async function onTogglePublish() {
    if (!classId || !termId) return;
    try {
      const res = await publish.mutateAsync({
        class_id: classId,
        term_id: termId,
        published: !allPublished,
      });
      toast.success(
        res.published
          ? `${res.affected} report${res.affected === 1 ? "" : "s"} published to parents.`
          : `${res.affected} report${res.affected === 1 ? "" : "s"} retracted.`,
      );
    } catch (err) {
      toast.error("Couldn't change publication", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const columns: DataTableColumn<TerminalReportRowVM>[] = [
    {
      key: "student",
      header: "Student",
      render: (r) => (
        <div>
          <p className="font-medium text-[var(--text)]">{r.student_name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{r.admission_no}</p>
        </div>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      align: "right",
      render: (r) => r.subject_count,
    },
    {
      key: "average",
      header: "Average",
      align: "right",
      // Null, not 0 — a student with no submitted marks has no average, and a zero would read as a fail.
      render: (r) =>
        r.average_score === null ? (
          <span className="text-[var(--muted-foreground)]">—</span>
        ) : (
          `${r.average_score}%`
        ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (r) => r.overall_grade ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "position",
      header: "Position",
      align: "right",
      render: (r) => r.position ?? <span className="text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: "attendance",
      header: "Attendance",
      align: "right",
      render: (r) =>
        r.attendance_total === 0 ? (
          <span className="text-[var(--muted-foreground)]">—</span>
        ) : (
          `${r.attendance_present}/${r.attendance_total}`
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.id === null ? (
          <StatusPill label="Not generated" tone="neutral" />
        ) : r.is_published ? (
          <StatusPill label="Published" tone="success" />
        ) : (
          <StatusPill label="Draft" tone="warning" />
        ),
    },
    {
      key: "comments",
      header: "",
      render: (r) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            // Only a generated report has an id to attach a comment to.
            disabled={r.id === null}
            onClick={() => setCommenting(r)}
          >
            <MessageSquare className="size-3.5" aria-hidden="true" />
            {r.class_teacher_comment || r.head_teacher_comment ? "Edit remarks" : "Add remarks"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Above the selectors, mirroring the reference build: it is a property of the term, not of
          the class being viewed, so it should not read as part of the filter row. */}
      <ReopeningDateBanner
        termId={termId}
        termName={selectedTerm?.name ?? null}
        reopeningDate={selectedTerm?.reopening_date ?? null}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tr-class">Class</Label>
          <Select value={classId} onValueChange={(v) => setClassId(v || null)} disabled={classesLoading}>
            <SelectTrigger id="tr-class" className="w-56">
              <SelectValue placeholder={classesLoading ? "Loading…" : "Select a class"}>
                {(v: string) => {
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
          <Label htmlFor="tr-term">Term</Label>
          <Select value={termId} onValueChange={(v) => setTermId(v || null)} disabled={termsLoading}>
            <SelectTrigger id="tr-term" className="w-56">
              <SelectValue placeholder={termsLoading ? "Loading…" : "Select a term"}>
                {(v: string) => (terms ?? []).find((t) => t.id === v)?.name ?? "Select a term"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(terms ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!classId || !termId || generate.isPending}
            onClick={onGenerate}
          >
            {generate.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {(sheet?.generated_count ?? 0) > 0 ? "Regenerate" : "Generate reports"}
          </Button>
          <Button
            type="button"
            disabled={!classId || !termId || (sheet?.generated_count ?? 0) === 0 || publish.isPending}
            onClick={onTogglePublish}
          >
            {publish.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {allPublished ? "Retract from parents" : "Publish to parents"}
          </Button>
        </div>
      </div>

      <div className={cardShellClass}>
        {!classId || !termId ? (
          <EmptyState
            icon={FileText}
            title="Select a class and term"
            description="Choose a class and term to see, generate and publish its terminal reports."
          />
        ) : isError ? (
          <ErrorState message="Couldn't load these reports." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No students enrolled"
            description="This class has no active enrolments, so there are no reports to generate."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm text-[var(--text)]">
                <span className="font-semibold">{sheet?.generated_count ?? 0}</span> of {rows.length}{" "}
                generated
                {(sheet?.published_count ?? 0) > 0 && ` · ${sheet?.published_count} published`}
              </p>
              {(sheet?.generated_count ?? 0) === 0 && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Figures below are a preview — nothing is saved until you generate.
                </p>
              )}
            </div>
            <DataTable columns={columns} data={rows} getRowId={(r) => r.student_id} pageSize={15} />
          </>
        )}
      </div>

      <ReportCommentsDialog row={commenting} onClose={() => setCommenting(null)} />
    </div>
  );
}
