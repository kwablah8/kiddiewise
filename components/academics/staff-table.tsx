"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { InvitePortalButton } from "@/components/people/invite-portal-button";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { StaffAvatar } from "./staff-avatar";
import { useStaff } from "@/lib/queries/academics";
import type { StaffVM } from "@/lib/validators/academics";
import { cardShellClass } from "@/lib/ui";

const columns: DataTableColumn<StaffVM>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <StaffAvatar firstName={row.first_name} lastName={row.last_name} size="sm" />
        <div className="min-w-0">
          <p className="font-medium text-[var(--text)]">
            {row.first_name} {row.last_name}
          </p>
          {row.position && (
            <p className="truncate text-xs text-[var(--muted-foreground)]">{row.position}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "staff_no",
    header: "Staff No.",
    hideOnMobile: true,
    render: (row) => <span className="font-medium">{row.staff_no}</span>,
  },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <span className="inline-flex rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--text)]">
        {row.role === "teacher" ? "Teacher" : "Administrator"}
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    hideOnMobile: true,
    render: (row) => row.email,
  },
  {
    key: "department",
    header: "Department",
    hideOnMobile: true,
    render: (row) =>
      row.department ?? <span className="text-[var(--muted-foreground)]">No Department</span>,
  },
  {
    key: "classes",
    header: "Classes",
    align: "right",
    hideOnMobile: true,
    render: (row) => row.class_count,
  },
  {
    key: "subjects",
    header: "Subjects",
    align: "right",
    hideOnMobile: true,
    render: (row) => row.subject_count,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <StatusPill label={row.is_active ? "Active" : "Inactive"} tone={row.is_active ? "success" : "neutral"} />
    ),
  },
  {
    key: "portal",
    header: "Portal",
    // Same deliberate split as parents: adding staff creates a dormant account, inviting them is a
    // separate act. Deactivated staff can't be invited — the action rejects it server-side.
    render: (row) =>
      row.is_active ? (
        <InvitePortalButton
          profileId={row.id}
          personName={`${row.first_name} ${row.last_name}`}
        />
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
];

interface StaffTableProps {
  onNewStaff: () => void;
}

/** Staff list — name w/ initials, staff_no, email, department, classes/subjects, status (06-UI §6). */
export function StaffTable({ onNewStaff }: StaffTableProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useStaff();
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
      {isError ? (
        <ErrorState message="Couldn't load staff." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add your first staff member to start assigning classes and subjects."
          action={
            <Button type="button" onClick={onNewStaff}>
              New Staff
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/staff/${row.id}`)}
          emptyTitle="No staff yet"
        />
      )}
    </div>
  );
}
