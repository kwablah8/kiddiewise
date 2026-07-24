"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { cn } from "@/lib/utils";

interface InquirySheetProps {
  /** The inquiry to show. May stay set while the sheet plays its close animation. */
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Admissions inquiry review, in a side sheet instead of a dedicated route (replaces the old
 * `/enquiries/[id]` page). Opened from the Admissions table and the dashboard's Recent Enquiries
 * panel. All four states live inside the sheet; status actions mutate in place (the sheet stays
 * open and the header status updates), while "Convert to student" navigates away to the prefilled
 * New Student form.
 */
export function InquirySheet({ id, open, onOpenChange }: InquirySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>{id ? <InquirySheetBody id={id} /> : null}</SheetContent>
    </Sheet>
  );
}

function InquirySheetBody({ id }: { id: string }) {
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
    <>
      <SheetHeader>
        <SheetTitle>{data?.applicant_name ?? "Admissions enquiry"}</SheetTitle>
        <SheetDescription>
          {data ? `Submitted ${formatDate(data.created_at)}` : "Loading enquiry details…"}
        </SheetDescription>
        {data ? (
          <StatusPill
            label={INQUIRY_STATUS_LABEL[data.status]}
            tone={inquiryStatusTone(data.status)}
            className="mt-1 self-start"
          />
        ) : null}
      </SheetHeader>

      <div className="mt-6 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-12 w-full" />
              ))}
            </div>
            <SkeletonBlock className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load this inquiry." onRetry={() => refetch()} />
        ) : !data ? (
          <EmptyState
            icon={ClipboardList}
            title="Inquiry not found"
            description="This inquiry may have been removed, or the link is incorrect."
          />
        ) : (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Desired class" value={data.desired_class} />
              <Field label="Parent / guardian" value={data.parent_name} />
              <Field label="Email" value={data.parent_email} />
              <Field label="Phone" value={data.parent_phone} />
            </dl>

            {data.message ? (
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">
                  Message
                </p>
                <p className="mt-1.5 text-sm whitespace-pre-line text-[var(--text)]">
                  {data.message}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {data ? (
        <SheetFooter className="mt-6 border-t border-[var(--border)] pt-5">
          <InquiryActions
            inquiry={{ id: data.id, status: data.status }}
            onRun={run}
            pending={setStatus.isPending}
          />
        </SheetFooter>
      ) : null}
    </>
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

/** Contextual action bar. `Convert to student` links to the prefilled New Student form; other
 *  targets mutate status in place. Terminal states show a muted note instead. */
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
      <p className="text-sm text-[var(--muted-foreground)]">
        This inquiry is {INQUIRY_STATUS_LABEL[inquiry.status].toLowerCase()} — no further actions.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-3">
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
