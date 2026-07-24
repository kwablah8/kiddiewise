"use client";

import { ClipboardList } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChildTabs } from "@/components/parent/child-tabs";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useChildProfile } from "@/lib/queries/parent";
import { formatDate, formatInitials } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export function ChildProfile({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useChildProfile(id);

  if (!isLoading && !isError && !data) {
    return (
      <div className={cardShellClass}>
        <EmptyState
          icon={ClipboardList}
          title="Child not found"
          description="This child isn't linked to your account, or the link is incorrect."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      {isLoading && (
        <div className={cn(cardShellClass, "space-y-4")}>
          <SkeletonBlock className="h-14 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load this child's profile." onRetry={() => refetch()} />
        </div>
      )}

      {data && (
        <>
          <div className={cn(cardShellClass, "flex items-center gap-4")}>
            <Avatar className="size-16 shrink-0">
              {data.photo_url && (
                <AvatarImage src={data.photo_url} alt={`${data.first_name} ${data.last_name}`} />
              )}
              <AvatarFallback className="bg-[var(--bg)] text-base font-medium text-[var(--text)]">
                {formatInitials(data.first_name, data.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-[var(--text)]">
                {data.first_name} {data.other_names ? `${data.other_names} ` : ""}
                {data.last_name}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {data.class_name ?? "No class yet"} · {data.admission_no}
              </p>
            </div>
          </div>

          <div className={cn(cardShellClass, "space-y-4")}>
            <h2 className="text-base font-semibold text-[var(--text)]">Student details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Admission number" value={data.admission_no} />
              <Field label="Class" value={data.class_name} />
              <Field label="Date of birth" value={formatDate(data.date_of_birth)} />
              <Field label="Gender" value={GENDER_LABEL[data.gender] ?? data.gender} />
            </dl>
          </div>

          <div className={cn(cardShellClass, "space-y-4")}>
            <h2 className="text-base font-semibold text-[var(--text)]">Teachers</h2>
            {data.teachers.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No teachers assigned yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.teachers.map((t, i) => (
                  <li
                    key={`${t.name}-${t.subject}-${i}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-[var(--text)]">{t.name}</span>
                    <span className="text-sm text-[var(--muted-foreground)]">{t.subject}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--text)]">
        {value ?? <span className="text-[var(--muted-foreground)]">—</span>}
      </dd>
    </div>
  );
}
