"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, UserRoundX } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { StaffAvatar } from "./staff-avatar";
import { StaffFormDialog } from "./staff-form";
import { useAssignmentsForStaff, useClasses, useStaffMember } from "@/lib/queries/academics";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface StaffDetailProps {
  id: string;
}

/** Profile + department + derived assigned classes/subjects for a staff member (06-UI §6/§7). */
export function StaffDetail({ id }: StaffDetailProps) {
  const { data, isLoading, isError, refetch } = useStaffMember(id);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);

  if (isLoading) return <StaffDetailSkeleton />;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff" />
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load this staff member." onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Staff not found"
          action={
            <Link href="/staff" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Staff
            </Link>
          }
        />
        <div className={cardShellClass}>
          <EmptyState
            icon={UserRoundX}
            title="Staff not found"
            description="This staff member may have been removed, or the link is incorrect."
          />
        </div>
      </div>
    );
  }

  const fullName = `${data.first_name} ${data.last_name}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        subtitle={`${data.staff_no}${data.department ? ` · ${data.department}` : " · No Department"}`}
        action={
          <Button
            type="button"
            className="gap-1.5"
            onClick={() => {
              setEditKey((k) => k + 1);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={cn(cardShellClass, "lg:col-span-1")}>
          <div className="flex items-center gap-4">
            <StaffAvatar firstName={data.first_name} lastName={data.last_name} size="lg" />
            <div className="space-y-1.5">
              <p className="text-lg font-semibold text-[var(--text)]">{fullName}</p>
              <StatusPill
                label={data.is_active ? "Active" : "Inactive"}
                tone={data.is_active ? "success" : "neutral"}
              />
            </div>
          </div>

          <dl className="mt-6 space-y-4">
            <DetailItem label="Staff No." value={data.staff_no} />
            <DetailItem label="Email" value={data.email} />
            <DetailItem label="Phone" value={data.phone ?? "—"} muted={!data.phone} />
            <DetailItem
              label="Department"
              value={data.department ?? "No Department"}
              muted={!data.department}
            />
          </dl>
        </section>

        <AssignedPanel staffId={id} classCount={data.class_count} subjectCount={data.subject_count} />
      </div>

      <StaffFormDialog key={editKey} mode="edit" staffId={id} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

/**
 * Derived "assigned classes/subjects" — unioned the same way `toStaffVM` computes
 * class_count/subject_count: classes where this staff is the homeroom class teacher (from
 * `useClasses`), plus subjects taught via `class_subjects` (from `useAssignmentsForStaff`).
 */
function AssignedPanel({
  staffId,
  classCount,
  subjectCount,
}: {
  staffId: string;
  classCount: number;
  subjectCount: number;
}) {
  const classesQuery = useClasses();
  const assignmentsQuery = useAssignmentsForStaff(staffId);

  const isLoading = classesQuery.isLoading || assignmentsQuery.isLoading;
  const isError = classesQuery.isError || assignmentsQuery.isError;

  const homeroomClasses = useMemo(
    () => (classesQuery.data ?? []).filter((c) => c.class_teacher_id === staffId),
    [classesQuery.data, staffId],
  );
  const subjectsTaught = assignmentsQuery.data ?? [];
  const isEmpty = !isLoading && !isError && homeroomClasses.length === 0 && subjectsTaught.length === 0;

  function retry() {
    void classesQuery.refetch();
    void assignmentsQuery.refetch();
  }

  return (
    <section className={cn(cardShellClass, "lg:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text)]">Classes &amp; Subjects</h3>
        <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
          {classCount} {classCount === 1 ? "class" : "classes"} · {subjectCount}{" "}
          {subjectCount === 1 ? "subject" : "subjects"}
        </span>
      </div>

      <div className="mt-4 space-y-5">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load assigned classes and subjects." onRetry={retry} />
        ) : isEmpty ? (
          <EmptyState
            icon={BookOpen}
            title="No classes or subjects assigned yet"
            description="Assign this teacher to a class or subject from a class's Assignments panel."
          />
        ) : (
          <>
            {homeroomClasses.length > 0 && (
              <div>
                <h4 className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">
                  Class teacher of
                </h4>
                <ul className="mt-2 divide-y divide-[var(--border)]">
                  {homeroomClasses.map((c) => (
                    <li key={c.id} className="py-2 text-sm font-medium text-[var(--text)] first:pt-0 last:pb-0">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {subjectsTaught.length > 0 && (
              <div>
                <h4 className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">
                  Subjects taught
                </h4>
                <ul className="mt-2 divide-y divide-[var(--border)]">
                  {subjectsTaught.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="truncate text-sm font-medium text-[var(--text)]">
                        {a.subject_name}
                      </span>
                      <span className="shrink-0 text-sm text-[var(--muted-foreground)]">
                        {a.class_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function DetailItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm font-medium",
          muted ? "text-[var(--muted-foreground)]" : "text-[var(--text)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function StaffDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-9 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={cn(cardShellClass, "space-y-4")}>
          <SkeletonBlock className="h-14 w-14 rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className={cn(cardShellClass, "lg:col-span-2 space-y-3")}>
          <SkeletonBlock className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
