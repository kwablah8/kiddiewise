"use client";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { ParentSectionSummary, TeacherSectionSummary } from "@/components/daily-reports/section-views";
import { useDailyReport } from "@/lib/queries/daily-reports";
import type { DailyStatusRowVM } from "@/lib/validators/daily-reports";

/**
 * Both sides of one child's daily report, read-only. The admin's record-keeping view: unlike the
 * teacher's own dialog, which pairs the parent's summary with an editable form for the teacher's
 * own section, nothing here is ever editable — the admin is looking the day up, not filling it in.
 */
export function ReportViewDialog({
  student,
  date,
  onClose,
}: {
  student: DailyStatusRowVM;
  date: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, refetch } = useDailyReport(student.student_id, date);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student.student_name}</DialogTitle>
          <DialogDescription>Daily report · {date}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
          </div>
        ) : isError || !data ? (
          <ErrorState message="Couldn't load this report." onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)]">Parent&apos;s report about the child</h3>
              <div className="mt-3">
                <ParentSectionSummary parent={data.parent} />
              </div>
            </section>

            <section className="border-t border-[var(--border)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Teacher&apos;s report about the child</h3>
              <div className="mt-3">
                <TeacherSectionSummary teacher={data.teacher} />
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
