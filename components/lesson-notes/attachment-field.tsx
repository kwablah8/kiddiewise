"use client";

import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import {
  LESSON_NOTE_ATTACHMENT_ACCEPT,
  LESSON_NOTE_ATTACHMENT_MAX_BYTES,
  LESSON_NOTE_ATTACHMENT_MIME_TYPES,
} from "@/lib/validators/lesson-notes";
import type { AttachmentChange } from "@/lib/storage/lesson-notes";

interface AttachmentFieldProps {
  /** The currently-saved attachment, if any — always null in the create dialog. */
  existing: { path: string; name: string } | null;
  /** Pending change since the dialog opened: a new file, "remove", or null (unchanged). */
  change: AttachmentChange;
  onChange: (change: AttachmentChange) => void;
  /** Opens a signed URL for the saved file — only called when `existing` and `change === null`. */
  onOpenExisting: () => void;
}

/**
 * A single-document picker for one lesson note. Nothing here touches Storage: it only collects
 * what changed so the surrounding form can upload/remove/save it together on submit, same as every
 * other field in the dialog. See lib/storage/lesson-notes.ts for the actual upload.
 */
export function AttachmentField({ existing, change, onChange, onOpenExisting }: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // lets picking the same file twice re-fire onChange
    if (!file) return;
    if (!LESSON_NOTE_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof LESSON_NOTE_ATTACHMENT_MIME_TYPES)[number])) {
      toast.error("That file type isn't supported.", { description: "Use PDF, Word or PowerPoint." });
      return;
    }
    if (file.size > LESSON_NOTE_ATTACHMENT_MAX_BYTES) {
      toast.error("That file is too large.", { description: "The limit is 10MB." });
      return;
    }
    onChange(file);
  }

  return (
    <div className="space-y-1.5">
      <Label>Attachment</Label>
      <input
        ref={inputRef}
        type="file"
        accept={LESSON_NOTE_ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={handleFileChosen}
      />

      {change instanceof File ? (
        <FileRow
          icon={<FileText className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />}
          label={change.name}
          onRemove={() => onChange(null)}
          removeLabel="Undo"
        />
      ) : change === "remove" || !existing ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()}>
          <Paperclip className="size-4" aria-hidden="true" />
          Attach a document
        </Button>
      ) : (
        <FileRow
          icon={<FileText className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />}
          label={existing.name}
          onClick={onOpenExisting}
          onRemove={() => onChange("remove")}
          removeLabel="Remove attachment"
        />
      )}
      <p className="text-xs text-[var(--muted-foreground)]">PDF, Word or PowerPoint, up to 10MB.</p>
    </div>
  );
}

function FileRow({
  icon,
  label,
  onClick,
  onRemove,
  removeLabel,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
      {icon}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 truncate text-left text-sm text-[var(--primary)] hover:underline"
        >
          {label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">{label}</span>
      )}
      <Button type="button" variant="ghost" size="icon-sm" aria-label={removeLabel} onClick={onRemove}>
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
