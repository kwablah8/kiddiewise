"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, UserRoundX, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { StudentAvatar } from "./student-avatar";
import { studentStatusTone } from "./student-status";
import { LinkGuardianDialog } from "./link-guardian-dialog";
import { useStudent, useStudentAcademics } from "@/lib/queries/people";
import { performanceBand } from "@/lib/grading";
import { formatDate, formatRole } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface StudentProfileProps {
  id: string;
}

/** Profile card + Guardians panel for a single student (06-UI §6/§7). */
export function StudentProfile({ id }: StudentProfileProps) {
  const { data, isLoading, isError, refetch } = useStudent(id);
  const academics = useStudentAcademics(id);
  const [linkOpen, setLinkOpen] = useState(false);
  // Bumped on every open so `LinkGuardianDialog` remounts fresh (RHF state reset without an
  // effect-driven `reset()` call).
  const [linkDialogKey, setLinkDialogKey] = useState(0);

  if (isLoading) return <ProfileSkeleton />;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student" />
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load this student." onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student not found"
          action={
            <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Students
            </Link>
          }
        />
        <div className={cardShellClass}>
          <EmptyState
            icon={UserRoundX}
            title="Student not found"
            description="This student may have been removed, or the link is incorrect."
          />
        </div>
      </div>
    );
  }

  const fullName = `${data.first_name} ${data.last_name}`;
  const hasMedical = Boolean(data.medical_conditions || data.allergies);
  const hasPrevSchool = Boolean(
    data.prev_school_name ||
      data.prev_class_ended ||
      data.prev_average_score ||
      data.prev_year_attended,
  );
  const hasContact = Boolean(data.email || data.phone || data.address || data.city || data.town);
  const hasAcademics = Boolean(
    academics.data && (academics.data.subjects.length > 0 || academics.data.report),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        subtitle={`Admission No. ${data.admission_no}${data.class_name ? ` · ${data.class_name}` : ""}`}
        backHref="/students"
        backLabel="Students"
        action={
          <Link
            href={`/students/${id}/edit`}
            className={cn(buttonVariants(), "gap-1.5")}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={cn(cardShellClass, "lg:col-span-2")}>
          <div className="flex items-center gap-4">
            <StudentAvatar
              firstName={data.first_name}
              lastName={data.last_name}
              photoUrl={data.photo_url}
              size="lg"
            />
            <div className="space-y-1.5">
              <p className="text-lg font-semibold text-[var(--text)]">{fullName}</p>
              <StatusPill
                label={formatRole(data.enrollment_status)}
                tone={studentStatusTone(data.enrollment_status)}
              />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <DetailItem label="Admission No." value={data.admission_no} />
            <DetailItem label="Date of birth" value={formatDate(data.date_of_birth)} />
            <DetailItem label="Gender" value={formatRole(data.gender)} />
            <DetailItem label="Class" value={data.class_name ?? "—"} muted={!data.class_name} />
            <DetailItem label="Other names" value={data.other_names ?? "—"} muted={!data.other_names} />
            <DetailItem label="Blood group" value={data.blood_group ?? "—"} muted={!data.blood_group} />
            <DetailItem
              label="Enrollment date"
              value={data.enrollment_date ? formatDate(data.enrollment_date) : "—"}
              muted={!data.enrollment_date}
            />
          </dl>
        </section>

        <section className={cardShellClass}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[var(--text)]">Guardians</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLinkDialogKey((k) => k + 1);
                setLinkOpen(true);
              }}
            >
              Link Parent
            </Button>
          </div>

          <div className="mt-4">
            {data.guardians.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No guardians linked"
                description="Link an existing parent record to this student using Link Parent above."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.guardians.map((g) => (
                  <li
                    key={g.parent_profile_id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text)]">{g.name}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {formatRole(g.relationship)} · {g.occupation ?? g.email}
                      </p>
                    </div>
                    {g.is_primary && <Badge className="shrink-0">Primary</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {hasMedical && (
        <section className={cardShellClass}>
          <h3 className="text-base font-semibold text-[var(--text)]">Medical</h3>
          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <DetailItem
              label="Medical conditions"
              value={data.medical_conditions ?? "—"}
              muted={!data.medical_conditions}
            />
            <DetailItem label="Allergies" value={data.allergies ?? "—"} muted={!data.allergies} />
          </dl>
        </section>
      )}

      {hasPrevSchool && (
        <section className={cardShellClass}>
          <h3 className="text-base font-semibold text-[var(--text)]">Previous school</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <DetailItem
              label="School name"
              value={data.prev_school_name ?? "—"}
              muted={!data.prev_school_name}
            />
            <DetailItem
              label="Class ended"
              value={data.prev_class_ended ?? "—"}
              muted={!data.prev_class_ended}
            />
            <DetailItem
              label="Average score"
              value={data.prev_average_score ? `${data.prev_average_score}%` : "—"}
              muted={!data.prev_average_score}
            />
            <DetailItem
              label="Year attended"
              value={data.prev_year_attended ?? "—"}
              muted={!data.prev_year_attended}
            />
          </dl>
        </section>
      )}

      {hasContact && (
        <section className={cardShellClass}>
          <h3 className="text-base font-semibold text-[var(--text)]">Contact</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <DetailItem label="Email" value={data.email ?? "—"} muted={!data.email} />
            <DetailItem label="Phone" value={data.phone ?? "—"} muted={!data.phone} />
            <DetailItem label="Address" value={data.address ?? "—"} muted={!data.address} />
            <DetailItem label="City" value={data.city ?? "—"} muted={!data.city} />
            <DetailItem label="Town" value={data.town ?? "—"} muted={!data.town} />
          </dl>
        </section>
      )}

      {(academics.isLoading || academics.isError || hasAcademics) && (
        <section className={cardShellClass}>
          <h3 className="text-base font-semibold text-[var(--text)]">Academic performance</h3>

          {academics.isLoading && (
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          )}

          {academics.isError && (
            <div className="mt-4">
              <ErrorState
                message="Couldn't load academic performance."
                onRetry={() => academics.refetch()}
              />
            </div>
          )}

          {!academics.isLoading && !academics.isError && academics.data && (
            <div className="mt-4 space-y-5">
              {academics.data.report && (
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-4">
                  <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                    Terminal report · {academics.data.term_name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Overall:{" "}
                    {academics.data.report.overall_average !== null
                      ? `${academics.data.report.overall_average}%`
                      : "—"}
                    {academics.data.report.overall_grade
                      ? ` · Grade ${academics.data.report.overall_grade}`
                      : ""}
                  </p>
                  {academics.data.report.class_teacher_remark && (
                    <p className="mt-2 text-sm text-[var(--text)] italic">
                      &ldquo;{academics.data.report.class_teacher_remark}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {academics.data.subjects.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                    {academics.data.term_name} results
                  </p>
                  <ul className="mt-2 divide-y divide-[var(--border)]">
                    {academics.data.subjects.map((s) => (
                      <li key={s.subject} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-medium text-[var(--text)]">
                            {s.subject}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-sm text-[var(--muted-foreground)]">
                              {s.score}%
                            </span>
                            <StatusPill label={s.grade} tone={performanceBand(s.score).tone} />
                          </span>
                        </div>
                        {s.teacher_comment && (
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {s.teacher_comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <LinkGuardianDialog
        key={linkDialogKey}
        studentId={id}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        excludeParentIds={data.guardians.map((g) => g.parent_profile_id)}
      />
    </div>
  );
}

function DetailItem({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
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

function ProfileSkeleton() {
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
        <div className={cn(cardShellClass, "lg:col-span-2 space-y-6")}>
          <SkeletonBlock className="h-14 w-14 rounded-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className={cardShellClass}>
          <SkeletonBlock className="h-6 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
