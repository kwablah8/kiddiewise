"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Pencil, School, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ClassFormDialog } from "./class-form";
import { AssignSubjectDialog } from "./assign-subject-dialog";
import { useAssignments, useClass, useUnassign } from "@/lib/queries/academics";
import type { AssignmentVM } from "@/lib/validators/academics";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface ClassDetailProps {
  id: string;
}

/** Class info + student count + Assignments panel (06-UI §6/§7). */
export function ClassDetail({ id }: ClassDetailProps) {
  const { data, isLoading, isError, refetch } = useClass(id);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);

  if (isLoading) return <ClassDetailSkeleton />;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Class" />
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load this class." onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Class not found"
          action={
            <Link href="/classes" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Classes
            </Link>
          }
        />
        <div className={cardShellClass}>
          <EmptyState
            icon={School}
            title="Class not found"
            description="This class may have been removed, or the link is incorrect."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        subtitle={`${data.level}${data.capacity ? ` · Capacity ${data.capacity}` : ""}`}
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
          <h3 className="text-base font-semibold text-[var(--text)]">Class info</h3>
          <dl className="mt-4 space-y-4">
            <DetailItem label="Level" value={data.level} />
            <DetailItem
              label="Capacity"
              value={data.capacity ? String(data.capacity) : "—"}
              muted={!data.capacity}
            />
            <DetailItem
              label="Class teacher"
              value={data.class_teacher_name ?? "—"}
              muted={!data.class_teacher_name}
            />
            <DetailItem label="Students enrolled" value={String(data.student_count)} />
          </dl>
        </section>

        <AssignmentsPanel classId={id} />
      </div>

      <ClassFormDialog
        key={editKey}
        mode="edit"
        classId={id}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

function AssignmentsPanel({ classId }: { classId: string }) {
  const { data, isLoading, isError, refetch } = useAssignments(classId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignKey, setAssignKey] = useState(0);
  const [unassignTarget, setUnassignTarget] = useState<AssignmentVM | null>(null);

  return (
    <section className={cn(cardShellClass, "lg:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text)]">Assignments</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setAssignKey((k) => k + 1);
            setAssignOpen(true);
          }}
        >
          Assign Subject
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load subject assignments." onRetry={() => refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects assigned yet"
            description="Assign a subject and teacher to this class using Assign Subject above."
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {data.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text)]">{a.subject_name}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {a.teacher_name ?? "Unassigned"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                  aria-label={`Unassign ${a.subject_name}`}
                  onClick={() => setUnassignTarget(a)}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AssignSubjectDialog key={assignKey} classId={classId} open={assignOpen} onOpenChange={setAssignOpen} />
      <ConfirmUnassignDialog
        assignment={unassignTarget}
        onOpenChange={(open) => {
          if (!open) setUnassignTarget(null);
        }}
      />
    </section>
  );
}

function ConfirmUnassignDialog({
  assignment,
  onOpenChange,
}: {
  assignment: AssignmentVM | null;
  onOpenChange: (open: boolean) => void;
}) {
  const unassign = useUnassign();

  async function handleConfirm() {
    if (!assignment) return;
    try {
      await unassign.mutateAsync({ id: assignment.id });
      toast.success("Subject unassigned", {
        description: `${assignment.subject_name} has been removed from this class.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!assignment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unassign subject?</DialogTitle>
          <DialogDescription>
            {assignment && (
              <>
                <strong className="text-[var(--text)]">{assignment.subject_name}</strong> will be
                removed from this class
                {assignment.teacher_name ? ` and unassigned from ${assignment.teacher_name}` : ""}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={unassign.isPending}
          >
            {unassign.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Unassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function ClassDetailSkeleton() {
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
          <SkeletonBlock className="h-5 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className={cn(cardShellClass, "lg:col-span-2 space-y-3")}>
          <SkeletonBlock className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
