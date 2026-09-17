"use client";

import Link from "next/link";
import { FileQuestion, FileText } from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { useLessonNote } from "@/lib/queries/lesson-notes";
import { getLessonNoteAttachmentUrl } from "@/lib/storage/lesson-notes";
import { formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Read-only: an admin only ever reaches a submitted note (ln_admin_select), there is nothing to edit here. */
export function LessonNoteDetail({ id, backHref = "/lesson-notes" }: { id: string; backHref?: string }) {
  const { data, isLoading, isError, refetch } = useLessonNote(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lesson note" backHref={backHref} backLabel="Lesson Notes" />
        <div className={cn(cardShellClass, "space-y-3")}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lesson note" backHref={backHref} backLabel="Lesson Notes" />
        <div className={cardShellClass}><ErrorState message="Couldn't load this lesson note." onRetry={() => refetch()} /></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lesson note not found"
          action={<Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>Back to Lesson Notes</Link>} />
        <div className={cardShellClass}>
          <EmptyState icon={FileQuestion} title="Lesson note not found"
            description="This note may not have been submitted yet, or the link is incorrect." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.topic}
        subtitle={`${data.class_name} · ${data.subject_name} · ${data.term_name}`}
        backHref={backHref}
        backLabel="Lesson Notes"
      />
      <div className={cardShellClass}>
        <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Teacher" value={data.teacher_name} />
          <Field label="Date" value={formatDate(data.date)} />
          <Field label="Term" value={data.term_name} />
          <Field label="Submitted" value={data.submitted_at ? formatDate(data.submitted_at) : "—"} />
        </dl>
        <div className="space-y-5">
          <Section label="Objectives" value={data.objectives} />
          <Section label="Content / activities" value={data.content} />
          <Section label="Homework" value={data.homework} />
          <Section label="Resources" value={data.resources} />
          {data.attachment_path && data.attachment_name && (
            <div>
              <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">Attachment</p>
              <AttachmentDownload path={data.attachment_path} name={data.attachment_name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentDownload({ path, name }: { path: string; name: string }) {
  async function handleOpen() {
    try {
      const url = await getLessonNoteAttachmentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open that file.");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="mt-1.5 gap-1.5" onClick={handleOpen}>
      <FileText className="size-4" aria-hidden="true" />
      {name}
    </Button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--text)]">{value}</dd>
    </div>
  );
}

function Section({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--label)] uppercase">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">
        {value || <span className="text-[var(--muted-foreground)]">—</span>}
      </p>
    </div>
  );
}
