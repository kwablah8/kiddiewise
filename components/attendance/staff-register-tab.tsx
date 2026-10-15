"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { ExportButtons } from "@/components/data/export-buttons";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveContext, useStaff, useTerms } from "@/lib/queries/academics";
import { useDevicePeople, useStaffPresenceDays } from "@/lib/queries/gate";
import { buildStaffAttendance, staffAttendanceColumns, staffAttendanceDetails } from "@/lib/staff/attendance";
import { STAFF_ROLE_LABEL } from "@/lib/staff/roles";
import { cardShellClass } from "@/lib/ui";
import type { StaffRole } from "@/lib/validators/academics";
import type { StaffAttendanceRowVM } from "@/lib/validators/attendance";

const ALL_ROLES = "all";

const columns: DataTableColumn<StaffAttendanceRowVM>[] = [
  { key: "name", header: "Name", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
  { key: "staff_no", header: "Staff No.", hideOnMobile: true, render: (r) => r.staff_no },
  { key: "role", header: "Role", hideOnMobile: true, render: (r) => STAFF_ROLE_LABEL[r.role] },
  { key: "present", header: "Present", align: "right", render: (r) => (r.tracked ? r.present : "—") },
  { key: "absent", header: "Absent", align: "right", render: (r) => (r.tracked ? r.absent : "—") },
  {
    key: "pct",
    header: "Attendance",
    align: "right",
    render: (r) =>
      !r.tracked ? (
        <span className="text-[var(--muted-foreground)]">No device number</span>
      ) : r.pct === null ? (
        <span className="text-[var(--muted-foreground)]">—</span>
      ) : (
        `${r.pct}%`
      ),
  },
];

/**
 * How often each staff member was at school over a term, from their gate scans. A school day is a
 * day on which any staff member scanned; see lib/staff/attendance.ts for the rule.
 */
export function StaffRegisterTab({ today }: { today: string }) {
  const active = useActiveContext();
  const terms = useTerms(active.data?.active_year?.id);
  const staff = useStaff();
  const people = useDevicePeople();
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | typeof ALL_ROLES>(ALL_ROLES);
  const termId = pickedTerm ?? active.data?.active_term?.id ?? null;
  const term = (terms.data ?? []).find((t) => t.id === termId);

  // A term still running has no scans for days that have not happened yet.
  const to = term ? (term.end_date < today ? term.end_date : today) : null;
  const presence = useStaffPresenceDays(term?.start_date ?? null, to);

  const linked = new Set((people.data ?? []).filter((p) => p.kind === "staff" && p.device_user_id).map((p) => p.id));
  const rows = buildStaffAttendance(
    (staff.data ?? []).filter((s) => role === ALL_ROLES || s.role === role),
    linked,
    presence.data ?? [],
  );

  const isLoading = terms.isLoading || staff.isLoading || people.isLoading || presence.isLoading;
  const isError = staff.isError || people.isError || presence.isError;
  const labels = [
    role === ALL_ROLES ? "All staff" : STAFF_ROLE_LABEL[role],
    term && active.data?.active_year ? `${term.name} · ${active.data.active_year.name}` : term?.name,
  ].filter((label): label is string => !!label);

  return (
    <div className="space-y-4">
      <div className={`${cardShellClass} flex flex-wrap items-end gap-4`}>
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
        <div className="space-y-1.5">
          <Label>Staff</Label>
          <Select value={role} onValueChange={(v) => setRole((v ?? ALL_ROLES) as StaffRole | typeof ALL_ROLES)}>
            <SelectTrigger className="w-44">
              <SelectValue>{(v: string) => (v === ALL_ROLES ? "All staff" : STAFF_ROLE_LABEL[v as StaffRole])}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>All staff</SelectItem>
              {(Object.keys(STAFF_ROLE_LABEL) as StaffRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {STAFF_ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <ExportButtons
            kind="staff-attendance"
            title="Staff Attendance"
            details={staffAttendanceDetails(labels, rows)}
            columns={staffAttendanceColumns}
            rows={rows}
            emptyMessage="No staff to list."
            disabled={!termId || isLoading || isError}
          />
        </div>
      </div>

      <div className={cardShellClass}>
        {isError ? (
          <ErrorState
            message="Couldn't load staff attendance."
            onRetry={() => {
              void staff.refetch();
              void people.refetch();
              void presence.refetch();
            }}
          />
        ) : !termId ? (
          <EmptyState icon={ClipboardList} title="Select a term" description="Choose a term to see staff attendance." />
        ) : !isLoading && rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No staff to show" description="Active staff will be listed here." />
        ) : (
          <>
            <DataTable columns={columns} data={rows} getRowId={(r) => r.staff_id} isLoading={isLoading} />
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Counted from gate scans. A school day is any day a staff member scanned in; someone with a device
              number who did not scan that day is absent. Staff without a device number are not measured.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
