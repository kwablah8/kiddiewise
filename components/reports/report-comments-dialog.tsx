"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSetReportComments } from "@/lib/queries/reports";
import { useSchool } from "@/lib/queries/school";
import { useGradeBands } from "@/lib/queries/grading";
import { downloadReportCard } from "@/lib/pdf/report-card";
import { ReportCardTable, ReportCardSummary } from "@/components/reports/report-card-view";
import { BRAND } from "@/lib/brand";
import type { TerminalReportRowVM } from "@/lib/validators/reports";

const textareaClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[var(--primary)]";

/** What the card prints that lives outside the report row — supplied by the sheet around it. */
export interface ReportCardContext {
  class_name: string;
  /** Labels the card's second position line ("Position in JHS"). */
  level_name: string;
  term_name: string;
  year_name: string | null;
  reopening_date: string | null;
  class_teacher_name: string | null;
  /** Teachers write the class-teacher fields; only admins see the head teacher's remark. */
  role: "admin" | "teacher";
}

/**
 * One child's full report card: the frozen subject table (Class Score · Exams Score · Total ·
 * Position · Remarks) above the fields a human writes — conduct, attitude, interest, promoted-to
 * and the remarks. Mounted fresh per row via `key`, so the fields initialise from that report
 * rather than carrying the previous child's words — writing one child's conduct onto another's
 * card is the kind of mistake a parent never forgets.
 */
export function ReportCommentsDialog({
  row,
  context,
  onClose,
}: {
  row: TerminalReportRowVM | null;
  context: ReportCardContext;
  onClose: () => void;
}) {
  if (!row?.id) return null;
  return <Form key={row.id} row={row} context={context} onClose={onClose} />;
}

function Form({
  row,
  context,
  onClose,
}: {
  row: TerminalReportRowVM;
  context: ReportCardContext;
  onClose: () => void;
}) {
  const [classComment, setClassComment] = useState(row.class_teacher_comment ?? "");
  const [headComment, setHeadComment] = useState(row.head_teacher_comment ?? "");
  const [conduct, setConduct] = useState(row.conduct ?? "");
  const [attitude, setAttitude] = useState(row.attitude ?? "");
  const [interest, setInterest] = useState(row.interest ?? "");
  const [promotedTo, setPromotedTo] = useState(row.promoted_to ?? "");
  const [downloading, setDownloading] = useState(false);
  const save = useSetReportComments();
  const { data: school } = useSchool();
  // The card prints the school's grading key; the same bands the scores were graded against.
  const { data: bands } = useGradeBands();
  const caWeight = school?.ca_weight ?? 50;

  async function onSave() {
    try {
      await save.mutateAsync({
        id: row.id!,
        class_teacher_comment: classComment,
        conduct,
        attitude,
        interest,
        promoted_to: promotedTo,
        // The head's remark belongs to the admin; a teacher save must not touch it (the schema
        // treats an omitted key as "leave alone").
        ...(context.role === "admin" ? { head_teacher_comment: headComment } : {}),
      });
      toast.success("Report saved", { description: row.student_name });
      onClose();
    } catch (err) {
      toast.error("Couldn't save this report", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  async function onDownload() {
    setDownloading(true);
    try {
      await downloadReportCard({
        schoolName: school?.name ?? BRAND.fullName,
        schoolAddress: school?.address ?? null,
        schoolEmail: school?.email ?? null,
        schoolPhone: school?.phone ?? null,
        studentFirstName: row.student_first_name,
        studentLastName: row.student_last_name,
        admissionNo: row.admission_no,
        className: context.class_name,
        levelName: context.level_name,
        yearName: context.year_name,
        termName: context.term_name,
        enrolledCount: row.enrolled_count,
        classTeacherName: context.class_teacher_name,
        position: row.position,
        levelPosition: row.level_position,
        levelSize: row.level_size,
        passes: row.passes,
        totalScore: row.total_score,
        averageScore: row.average_score,
        classAverage: row.class_average,
        classLowestAverage: row.class_lowest_average,
        classHighestAverage: row.class_highest_average,
        reopeningDate: context.reopening_date,
        attendancePresent: row.attendance_present,
        attendanceTotal: row.attendance_total,
        subjects: row.subjects,
        gradeBands: bands ?? [],
        // The unsaved edits print, not the last saved ones — a teacher who writes a remark and hits
        // Download expects the words in front of them on the page.
        conduct: conduct.trim() || null,
        attitude: attitude.trim() || null,
        interest: interest.trim() || null,
        promotedTo: promotedTo.trim() || null,
        classTeacherRemark: classComment.trim() || null,
        headTeacherRemark: headComment.trim() || null,
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
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report card — {row.student_name}</DialogTitle>
          <DialogDescription>
            {context.class_name} · {context.term_name}
            {row.average_score !== null && ` · Average ${row.average_score}%`}
            {row.position !== null && ` · Position ${row.position}`}
            {row.is_published && " · Visible to parents"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* The frozen subject table — regenerate the class to refresh it. */}
          {row.subjects.length === 0 ? (
            <p className="rounded-lg bg-[var(--bg)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
              No subject rows yet — generate the reports to snapshot this term&apos;s scores.
            </p>
          ) : (
            <>
              <ReportCardTable
                subjects={row.subjects}
                caWeight={caWeight}
                enrolledCount={row.enrolled_count}
              />
              <ReportCardSummary totals={row} levelName={context.level_name} />
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rc-conduct">Conduct</Label>
              <textarea id="rc-conduct" rows={2} maxLength={500} value={conduct}
                onChange={(e) => setConduct(e.target.value)} className={textareaClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-attitude">Attitude</Label>
              <textarea id="rc-attitude" rows={2} maxLength={500} value={attitude}
                onChange={(e) => setAttitude(e.target.value)} className={textareaClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-interest">Interest</Label>
              <textarea id="rc-interest" rows={2} maxLength={500} value={interest}
                onChange={(e) => setInterest(e.target.value)} className={textareaClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-promoted">Promoted to</Label>
              <input id="rc-promoted" maxLength={100} value={promotedTo}
                onChange={(e) => setPromotedTo(e.target.value)}
                placeholder="e.g. Basic 5 (Third Term only)"
                className={textareaClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class-remark">Class teacher&apos;s remark</Label>
            <textarea id="class-remark" rows={3} maxLength={1000} value={classComment}
              onChange={(e) => setClassComment(e.target.value)}
              placeholder="How has this child worked this term?" className={textareaClass} />
          </div>

          {context.role === "admin" && (
            <div className="space-y-1.5">
              <Label htmlFor="head-remark">Head teacher&apos;s remark</Label>
              <textarea id="head-remark" rows={3} maxLength={1000} value={headComment}
                onChange={(e) => setHeadComment(e.target.value)}
                placeholder="Promotion decision, or a closing note." className={textareaClass} />
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 sm:justify-between">
          <Button type="button" variant="outline" className="gap-1.5" disabled={downloading} onClick={onDownload}>
            {downloading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            Download PDF
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={save.isPending} onClick={onSave}>
              {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save report
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
