"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { ListPanel } from "@/components/data/list-panel";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { StatusPill } from "@/components/data/status-pill";
import { InquirySheet } from "@/components/admissions/inquiry-sheet";
import { useInquiries } from "@/lib/queries/inquiries";
import { INQUIRY_STATUS_LABEL, inquiryStatusTone } from "@/components/admissions/inquiry-status";
import { formatDate } from "@/lib/format";
import { lightFocusRingClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const MAX_ROWS = 5;

/**
 * Dashboard "Recent Enquiries" — the newest website admissions enquiries, surfaced on the admin
 * home for quick triage. Rows open the same side sheet used by the Admissions table (no route
 * change); "View all" links through to the full /enquiries list.
 */
export function RecentEnquiries() {
  const { data, isLoading, isError, refetch } = useInquiries();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const rows = (data ?? []).slice(0, MAX_ROWS);
  const isEmpty = !isLoading && !isError && (data?.length ?? 0) === 0;

  function openInquiry(id: string) {
    setActiveId(id);
    setOpen(true);
  }

  return (
    <ListPanel
      title="Recent Enquiries"
      viewAllHref="/enquiries"
      isEmpty={isEmpty}
      emptyTitle="No enquiries yet"
      emptyDescription="Enquiries submitted from your school website will appear here."
    >
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: MAX_ROWS }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState message="Couldn't load recent enquiries." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-[var(--border)]">
          {rows.map((inquiry) => (
            <li key={inquiry.id}>
              <button
                type="button"
                onClick={() => openInquiry(inquiry.id)}
                aria-label={`Review enquiry from ${inquiry.applicant_name}`}
                className={cn(
                  "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--bg)]",
                  lightFocusRingClass,
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--muted-foreground)]">
                  <ClipboardList className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text)]">
                    {inquiry.applicant_name}
                  </p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {inquiry.desired_class ?? "Class not specified"} · {formatDate(inquiry.created_at)}
                  </p>
                </div>
                <StatusPill
                  label={INQUIRY_STATUS_LABEL[inquiry.status]}
                  tone={inquiryStatusTone(inquiry.status)}
                  className="shrink-0"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <InquirySheet id={activeId} open={open} onOpenChange={setOpen} />
    </ListPanel>
  );
}
