"use client";

import { useState } from "react";
import { CalendarDays, Download, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/format";

import { ChildTabs } from "@/components/parent/child-tabs";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useChildResults, useChildReport, useChildProfile } from "@/lib/queries/parent";
import { useSchool } from "@/lib/queries/school";
import { downloadReportCard } from "@/lib/pdf/report-card";
import { BRAND } from "@/lib/brand";
import { performanceBand } from "@/lib/grading";
import type { ChildProfileVM, ChildResultsVM, TerminalReportVM } from "@/lib/validators/parent";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ChildResults({ id }: { id: string }) {
  const results = useChildResults(id);
  const report = useChildReport(id);
  // Cached from the Profile tab in most sessions; the report card prints the child's name.
  const profile = useChildProfile(id);

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
            <ReportCard report={report.data} profile={profile.data ?? null} />
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

/** A cell of the card's header block: NAME / CLASS / TERM / POSITION and friends. */
function HeaderField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold tracking-[0.08em] text-[var(--label)] uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-[var(--text)]">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

function Paragraph({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.08em] text-[var(--label)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--text)]">{value}</p>
    </div>
  );
}

/**
 * The published report card, laid out like the school's paper Terminal Report Sheet: title band,
 * header block, the five-column subject table, then attendance, promotion and the class teacher's
 * paragraphs. The PDF downloads the same card on the school's letterhead — that is the copy that
 * gets printed or forwarded.
 */
function ReportCard({
  report,
  profile,
}: {
  report: TerminalReportVM;
  profile: ChildProfileVM | null;
}) {
  const { data: school } = useSchool();
  const [downloading, setDownloading] = useState(false);
  const caWeight = school?.ca_weight ?? 50;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadReportCard({
        schoolName: school?.name ?? BRAND.fullName,
        schoolAddress: school?.address ?? null,
        schoolEmail: school?.email ?? null,
        studentName: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
        admissionNo: profile?.admission_no ?? "",
        className: report.class_name ?? profile?.class_name ?? "",
        yearName: report.year_name,
        termName: report.term_name,
        enrolledCount: report.enrolled_count,
        classTeacherName: report.class_teacher_name,
        position: report.position,
        reopeningDate: report.reopening_date,
        attendancePresent: report.attendance_present,
        attendanceTotal: report.attendance_total,
        subjects: report.subjects,
        conduct: report.conduct,
        attitude: report.attitude,
        interest: report.interest,
        promotedTo: report.promoted_to,
        classTeacherRemark: report.class_teacher_remark || null,
        caWeight,
        logoSrc: school?.logo_url ?? BRAND.crest.src,
      });
    } catch {
      toast.error("Couldn't build the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={cn(cardShellClass, "space-y-5")}>
      {/* Title band, echoing the paper sheet. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--brand-top,#1d2f65)] px-4 py-2.5">
        <p className="text-sm font-semibold tracking-[0.14em] text-white uppercase">
          Terminal Report Sheet
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={downloading}
          onClick={handleDownload}
          className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          Download PDF
        </Button>
      </div>

      {/* Header block — the card's identity lines. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <HeaderField
          label="Name"
          value={profile ? `${profile.first_name} ${profile.last_name}` : null}
        />
        <HeaderField label="Class" value={report.class_name ?? profile?.class_name ?? null} />
        <HeaderField label="Academic year" value={report.year_name} />
        <HeaderField label="Term" value={report.term_name} />
        <HeaderField
          label="No. on roll"
          value={report.enrolled_count === null ? null : String(report.enrolled_count)}
        />
        <HeaderField label="Class teacher" value={report.class_teacher_name} />
        <HeaderField
          label="Position"
          value={report.position === null ? null : String(report.position)}
        />
        <HeaderField
          label="Overall"
          value={
            report.overall_average === null
              ? null
              : `${report.overall_average}%${report.overall_grade ? ` · ${report.overall_grade}` : ""}`
          }
        />
      </dl>

      {/* The subject table, bordered like the sheet. */}
      {report.subjects.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="px-3 py-2 font-semibold">Subjects</th>
                <th className="px-3 py-2 text-right font-semibold">Class {caWeight}%</th>
                <th className="px-3 py-2 text-right font-semibold">Exams {100 - caWeight}%</th>
                <th className="px-3 py-2 text-right font-semibold">Total 100%</th>
                <th className="px-3 py-2 text-right font-semibold">Position</th>
                <th className="px-3 py-2 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((s) => (
                <tr key={s.subject_name} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[var(--text)]">{s.subject_name}</td>
                  <td className="px-3 py-2 text-right">{s.class_score ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{s.exam_score ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{s.total ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{s.position ?? "—"}</td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">{s.remark ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance · promotion · the teacher's paragraphs. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <HeaderField
          label="Attendance"
          value={
            report.attendance_total === 0
              ? null
              : `${report.attendance_present} out of ${report.attendance_total}`
          }
        />
        <HeaderField label="Promoted to" value={report.promoted_to} />
      </dl>
      <div className="space-y-3">
        <Paragraph label="Conduct" value={report.conduct} />
        <Paragraph label="Attitude" value={report.attitude} />
        <Paragraph label="Interest" value={report.interest} />
        <Paragraph label="Class teacher's remarks" value={report.class_teacher_remark || null} />
      </div>

      {/* After the grades, this is the line a parent came to find — they plan childcare and
          travel around it. Absent when the school has not confirmed a date. */}
      {report.reopening_date && (
        <p className="flex items-center gap-1.5 border-t border-[var(--border)] pt-4 text-sm font-medium text-[var(--text)]">
          <CalendarDays className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
          School reopens {formatDate(report.reopening_date)}
        </p>
      )}
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
