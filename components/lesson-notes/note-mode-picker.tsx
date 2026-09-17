"use client";

import { Paperclip, PencilLine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LessonNoteMode = "template" | "upload";

/**
 * The either/or choice a lesson note starts from: write it with the template, or attach a
 * document instead of typing it out. Mutually exclusive by design — a note is one or the other,
 * not both, so only the relevant fields ever show at once.
 */
export function LessonNoteModePicker({
  value,
  onChange,
}: {
  value: LessonNoteMode | null;
  onChange: (mode: LessonNoteMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ModeCard
        icon={PencilLine}
        title="Use the template"
        description="Objectives, content, homework, resources."
        selected={value === "template"}
        onClick={() => onChange("template")}
      />
      <ModeCard
        icon={Paperclip}
        title="Upload a document"
        description="PDF, Word or PowerPoint instead."
        selected={value === "upload"}
        onClick={() => onChange("upload")}
      />
    </div>
  );
}

function ModeCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
          : "border-[var(--border)] hover:bg-[var(--bg)]",
      )}
    >
      <Icon
        className={cn("size-5", selected ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]")}
        aria-hidden="true"
      />
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
    </button>
  );
}

/** Small "change your mind" link shown once a mode is picked, next to that section's label. */
export function ChangeModeLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-[var(--primary)] hover:underline">
      Change
    </button>
  );
}
