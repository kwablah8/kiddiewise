"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import type { TerminalReportRowVM } from "@/lib/validators/reports";

/**
 * Remarks on one child's terminal report.
 *
 * Mounted fresh per row via `key`, so the textareas initialise from that report rather than carrying
 * the previous child's remarks — writing one child's comment onto another's report card is the kind of
 * mistake a parent never forgets.
 */
export function ReportCommentsDialog({
  row,
  onClose,
}: {
  row: TerminalReportRowVM | null;
  onClose: () => void;
}) {
  if (!row?.id) return null;
  return <Form key={row.id} row={row} onClose={onClose} />;
}

function Form({ row, onClose }: { row: TerminalReportRowVM; onClose: () => void }) {
  const [classComment, setClassComment] = useState(row.class_teacher_comment ?? "");
  const [headComment, setHeadComment] = useState(row.head_teacher_comment ?? "");
  const save = useSetReportComments();

  async function onSave() {
    try {
      await save.mutateAsync({
        id: row.id!,
        class_teacher_comment: classComment,
        head_teacher_comment: headComment,
      });
      toast.success("Remarks saved", { description: row.student_name });
      onClose();
    } catch (err) {
      toast.error("Couldn't save those remarks", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remarks for {row.student_name}</DialogTitle>
          <DialogDescription>
            {row.average_score === null
              ? "This student has no submitted marks yet."
              : `Average ${row.average_score}%${row.overall_grade ? ` · Grade ${row.overall_grade}` : ""}${
                  row.position ? ` · Position ${row.position}` : ""
                }`}
            {row.is_published && " · Already visible to parents"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="class-remark">Class teacher&apos;s remark</Label>
            <textarea
              id="class-remark"
              rows={3}
              maxLength={1000}
              value={classComment}
              onChange={(e) => setClassComment(e.target.value)}
              placeholder="How has this child worked this term?"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[var(--primary)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="head-remark">Head teacher&apos;s remark</Label>
            <textarea
              id="head-remark"
              rows={3}
              maxLength={1000}
              value={headComment}
              onChange={(e) => setHeadComment(e.target.value)}
              placeholder="Promotion decision, or a closing note."
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[var(--primary)]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={save.isPending} onClick={onSave}>
            {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save remarks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
