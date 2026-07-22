"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, School } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ClassFormDialog } from "./class-form";
import { useAssignments, useClass } from "@/lib/queries/academics";
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

  return (
    <section className={cn(cardShellClass, "lg:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text)]">Assignments</h3>
        {/* wired in Unit C: opens the assign-subject dialog (subject + teacher select). */}
        <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
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
                <span className="truncate text-sm font-medium text-[var(--text)]">
                  {a.subject_name}
                </span>
                <span className="shrink-0 text-sm text-[var(--muted-foreground)]">
                  {a.teacher_name ?? "Unassigned"}
                </span>
              </li>
            ))}
          </ul>
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
