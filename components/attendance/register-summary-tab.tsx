"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { ExportButtons } from "@/components/data/export-buttons";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSummaryColumns, registerSummaryDetails } from "@/lib/attendance";
import { useActiveContext, useClasses, useTerms } from "@/lib/queries/academics";
import { useRegisterSummary } from "@/lib/queries/attendance";
import { cardShellClass } from "@/lib/ui";
import type { RegisterSummaryRowVM } from "@/lib/validators/attendance";

const columns: DataTableColumn<RegisterSummaryRowVM>[] = [
  { key: "name", header: "Student", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
  { key: "admission", header: "Admission No.", hideOnMobile: true, render: (r) => r.admission_no },
  { key: "present", header: "Present", align: "right", render: (r) => r.present },
  { key: "late", header: "Late", align: "right", render: (r) => r.late },
  { key: "absent", header: "Absent", align: "right", render: (r) => r.absent },
  {
    key: "pct",
    header: "Attendance",
    align: "right",
    render: (r) => (r.pct === null ? <span className="text-[var(--muted-foreground)]">—</span> : `${r.pct}%`),
  },
];

/** How often each student in a class was present, late or absent over a term, from the register. */
export function RegisterSummaryTab() {
  const classes = useClasses();
  const active = useActiveContext();
  const terms = useTerms(active.data?.active_year?.id);
  const [classId, setClassId] = useState<string | null>(null);
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const termId = pickedTerm ?? active.data?.active_term?.id ?? null;

  const summary = useRegisterSummary(classId, termId);
  const rows = summary.data ?? [];
  const className = (classes.data ?? []).find((c) => c.id === classId)?.name;
  const term = (terms.data ?? []).find((t) => t.id === termId);
  const labels = [className, term && active.data?.active_year ? `${term.name} · ${active.data.active_year.name}` : term?.name].filter(
    (label): label is string => !!label,
  );

  return (
    <div className="space-y-4">
      <div className={`${cardShellClass} flex flex-wrap items-end gap-4`}>
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId} disabled={classes.isLoading}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={classes.isLoading ? "Loading classes…" : "Select a class"}>
                {(v: string) => (classes.data ?? []).find((c) => c.id === v)?.name ?? "Select a class"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Term</Label>
          <Select value={termId} onValueChange={setPickedTerm} disabled={terms.isLoading}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select a term">
                {(v: string) => (terms.data ?? []).find((t) => t.id === v)?.name ?? "Select a term"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(terms.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <ExportButtons
            kind="register-summary"
            title="Attendance Register Summary"
            details={registerSummaryDetails(labels, rows)}
            columns={registerSummaryColumns}
            rows={rows}
            emptyMessage="No students on this class's roll."
            disabled={!classId || summary.isLoading || summary.isError}
          />
        </div>
      </div>

      <div className={cardShellClass}>
        {!classId || !termId ? (
          <EmptyState
            icon={ClipboardList}
            title="Select a class"
            description="Choose a class and term to see how often each student was present."
          />
        ) : summary.isError ? (
          <ErrorState message="Couldn't load the register." onRetry={() => summary.refetch()} />
        ) : !summary.isLoading && rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No students in this class"
            description="Students enrolled in this class this year will be listed here."
          />
        ) : (
          <DataTable columns={columns} data={rows} getRowId={(r) => r.student_id} isLoading={summary.isLoading} />
        )}
      </div>
    </div>
  );
}
