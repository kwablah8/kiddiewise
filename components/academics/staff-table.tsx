"use client";

import { useState } from "react";

import { useAppRouter } from "@/lib/navigation";
import { Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { InvitePortalButton } from "@/components/people/invite-portal-button";
import { SendCredentialsButton } from "@/components/people/send-credentials-button";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { StaffAvatar } from "./staff-avatar";
import { useStaff } from "@/lib/queries/academics";
import { useSession } from "@/lib/auth/useSession";
import type { StaffVM } from "@/lib/validators/academics";
import { PORTAL_ACCESS_LABEL, type PortalAccessStatus } from "@/lib/validators/people";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";

// Tone tracks how much attention the row needs: a teacher still holding a password the admin also
// knows is not a failure, but it isn't finished either — hence "warning" rather than "success".
const PORTAL_TONE: Record<PortalAccessStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  expired: "danger",
  no_access: "neutral",
};

function buildColumns(currentUserId: string | null): DataTableColumn<StaffVM>[] {
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
      render: (row) => {
        // An admin is a staff member, so the row for whoever is signed in is on this list too — and
        // both of these actions target somebody ELSE's account by definition. "Send credentials" on
        // your own row revokes the password you are using (see reissueTempPassword's guard, which is
        // what actually enforces this); an invite link to yourself is merely pointless. Marking the
        // row rather than leaving the cell blank answers the obvious question of why it has no
        // buttons.
        if (row.id === currentUserId) {
          return <span className="block text-right text-[var(--muted-foreground)]">You</span>;
        }
        // Deactivated staff get no actions at all: both the reissue and the invite reject them
        // server-side, so offering the buttons would only produce an error toast.
        if (!row.is_active) {
          return <span className="block text-right text-[var(--muted-foreground)]">—</span>;
        }
        return (
          <div className="flex items-center justify-end gap-2">
            {/* Reissues rather than reveals: the original password is a hash and cannot be shown again. */}
            <SendCredentialsButton
              profileId={row.id}
              personName={`${row.first_name} ${row.last_name}`}
            />
            <InvitePortalButton
              profileId={row.id}
              personName={`${row.first_name} ${row.last_name}`}
              label="Send link"
            />
          </div>
        );
      },
    },
  ];
}

interface StaffTableProps {
  onNewStaff: () => void;
}

/** Staff list — name w/ initials, staff_no, email, department, classes/subjects, status (06-UI §6). */
export function StaffTable({ onNewStaff }: StaffTableProps) {
  const router = useAppRouter();
  const { data, isLoading, isError, refetch } = useStaff();
  // Only to recognise the caller's own row below. Null while the session loads, which merely means
  // the row shows its buttons for a moment — the server guard is what makes pressing one safe.
  const { profile } = useSession();
  const [query, setQuery] = useState("");
  const rows = (data ?? []).filter((r) =>
    matchesQuery(query, r.first_name, r.last_name, r.email, r.staff_no, r.department, r.position),
  );
  const isEmpty = !isLoading && !isError && rows.length === 0;
  const noneAtAll = (data?.length ?? 0) === 0;

  return (
    <div className={cardShellClass}>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search by name, email, staff no. or department"
        label="Search staff"
        className="mb-3"
      />
      {isError ? (
        <ErrorState message="Couldn't load staff." onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Users}
          title={noneAtAll ? "No staff yet" : "No matching staff"}
          description={
            noneAtAll
              ? "Add your first staff member to start assigning classes and subjects."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
          action={
            noneAtAll ? (
              <Button type="button" onClick={onNewStaff}>
                New Staff
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={buildColumns(profile?.id ?? null)}
          data={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/staff/${row.id}`)}
          emptyTitle="No staff yet"
        />
      )}
    </div>
  );
}
