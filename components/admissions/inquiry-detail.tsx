"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useInquiry, useSetInquiryStatus } from "@/lib/queries/inquiries";
import type { InquiryStatus } from "@/lib/validators/inquiries";
import { inquiryActionsFor } from "@/lib/inquiries";
import { INQUIRY_STATUS_LABEL, inquiryStatusTone } from "@/components/admissions/inquiry-status";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Inquiry review page — full details, message, and status actions scoped to the current status. */
export function InquiryDetail({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useInquiry(id);
  const setStatus = useSetInquiryStatus();

  async function run(status: InquiryStatus) {
    try {
      await setStatus.mutateAsync({ id, status });
      toast.success("Inquiry updated", {
        description: `Status set to ${INQUIRY_STATUS_LABEL[status].toLowerCase()}.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the inquiry.");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admissions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Admissions
      </Link>

      {isLoading ? (
        <div className={cn(cardShellClass, "space-y-4")}>
          <SkeletonBlock className="h-8 w-56" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
          <SkeletonBlock className="h-24 w-full" />
        </div>
      ) : isError ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load this inquiry." onRetry={() => refetch()} />
        </div>
      ) : !data ? (
        <div className={cardShellClass}>
          <EmptyState
            title="Inquiry not found"
            description="This inquiry may have been removed, or the link is incorrect."
            action={
              <Link href="/admissions" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to Admissions
              </Link>
            }
          />
        </div>
      ) : (
        <div className={cn(cardShellClass, "space-y-6")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text)]">
                  {data.applicant_name}
                </h1>
                <StatusPill
                  label={INQUIRY_STATUS_LABEL[data.status]}
                  tone={inquiryStatusTone(data.status)}
                />
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Submitted {formatDate(data.created_at)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Desired class" value={data.desired_class} />
            <Field label="Parent / guardian" value={data.parent_name} />
            <Field label="Email" value={data.parent_email} />
            <Field label="Phone" value={data.parent_phone} />
          </dl>

          {data.message && (
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                Message
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-line text-[var(--text)]">{data.message}</p>
            </div>
          )}

          <InquiryActions
            inquiry={{ id: data.id, status: data.status }}
            onRun={run}
            pending={setStatus.isPending}
          />
        </div>
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

/** Contextual action bar. `Convert to student` links to the prefilled New Student form (Task 5);
 *  other targets mutate status in place. Terminal states show a muted note instead. */
function InquiryActions({
  inquiry,
  onRun,
  pending,
}: {
  inquiry: { id: string; status: InquiryStatus };
  onRun: (status: InquiryStatus) => void;
  pending: boolean;
}) {
  const actions = inquiryActionsFor(inquiry.status);

  if (actions.length === 0) {
    return (
      <p className="border-t border-[var(--border)] pt-5 text-sm text-[var(--muted-foreground)]">
        This inquiry is {INQUIRY_STATUS_LABEL[inquiry.status].toLowerCase()} — no further actions.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-5">
      {actions.map((a) =>
        a.status === "converted" ? (
          <Link
            key={a.status}
            href={`/students/new?fromInquiry=${inquiry.id}`}
            className={cn(buttonVariants())}
          >
            {a.label}
          </Link>
        ) : (
          <Button
            key={a.status}
            variant={a.variant}
            disabled={pending}
            onClick={() => onRun(a.status)}
          >
            {a.label}
          </Button>
        ),
      )}
    </div>
  );
}
