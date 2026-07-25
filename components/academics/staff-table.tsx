"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Users } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { InvitePortalButton } from "@/components/people/invite-portal-button";
import { CredentialsDialog } from "@/components/people/credentials-dialog";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { StaffAvatar } from "./staff-avatar";
import { useStaff } from "@/lib/queries/academics";
import { useReissueCredentials } from "@/lib/queries/people";
import type { StaffVM } from "@/lib/validators/academics";
import { PORTAL_ACCESS_LABEL, type PortalAccessStatus } from "@/lib/validators/people";
import type { IssuedCredentials } from "@/lib/temp-password";
import { cardShellClass } from "@/lib/ui";

// Tone tracks how much attention the row needs: a teacher still holding a password the admin also
// knows is not a failure, but it isn't finished either — hence "warning" rather than "success".
const PORTAL_TONE: Record<PortalAccessStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  expired: "danger",
  no_access: "neutral",
};

function buildColumns(
  onSend: (row: StaffVM) => void,
  sendingId: string | null,
): DataTableColumn<StaffVM>[] {
  return [
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
      header: "Employment",
      render: (row) => (
        <StatusPill
          label={row.is_active ? "Active" : "Inactive"}
          tone={row.is_active ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "portal_status",
      header: "Portal access",
      // "Active" means they signed in and replaced the temporary password — i.e. the account is
      // genuinely theirs and the admin no longer knows the credential.
      render: (row) => (
        <StatusPill
          label={PORTAL_ACCESS_LABEL[row.portal_status]}
          tone={PORTAL_TONE[row.portal_status]}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      // Deactivated staff get no actions at all: both the reissue and the invite reject them
      // server-side, so offering the buttons would only produce an error toast.
      render: (row) =>
        row.is_active ? (
          <div className="flex items-center justify-end gap-2">
            {/* Reissues rather than reveals: the original password is a hash and cannot be shown again. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sendingId === row.id}
              onClick={() => onSend(row)}
            >
              {sendingId === row.id ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-3.5" aria-hidden="true" />
              )}
              Send credentials
            </Button>
            <InvitePortalButton
              profileId={row.id}
              personName={`${row.first_name} ${row.last_name}`}
              label="Send link"
            />
          </div>
        ) : (
          <span className="block text-right text-[var(--muted-foreground)]">—</span>
        ),
    },
  ];
}

interface StaffTableProps {
  onNewStaff: () => void;
}

/** Staff list — name w/ initials, staff_no, email, department, classes/subjects, status (06-UI §6). */
export function StaffTable({ onNewStaff }: StaffTableProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useStaff();
  const reissue = useReissueCredentials();
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  async function sendCredentials(row: StaffVM) {
    setSendingId(row.id);
    try {
      setIssued(await reissue.mutateAsync({ profile_id: row.id }));
    } catch (err) {
      toast.error("Couldn't issue credentials", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className={cardShellClass}>
      <CredentialsDialog credentials={issued} onClose={() => setIssued(null)} />
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
          columns={buildColumns(sendCredentials, sendingId)}
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
