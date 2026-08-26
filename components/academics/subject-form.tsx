"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSubject, useUpdateSubject } from "@/lib/queries/academics";
import {
  subjectCreateSchema,
  type SubjectCreateInput,
  type SubjectVM,
} from "@/lib/validators/academics";

// `subjectCreateSchema` has a `.default(null)` on `code`, so its input type (what the form
// collects) differs from its output type (what create/update require), same pattern as
// `student-form.tsx` / `class-form.tsx`.
type SubjectFormInput = z.input<typeof subjectCreateSchema>;

interface SubjectFormDialogProps {
  mode: "create" | "edit";
  /** Required when `mode === "edit"`, the row already loaded by the subjects table/list. */
  subject?: SubjectVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create/edit dialog for a subject (name, code). Duplicate name (case-insensitive, unique per
 * school) surfaces as an inline field error rather than a generic banner, the action throws
 * that exact message. Form state isn't reset on close; the caller remounts with a fresh `key`
 * on every open (mirrors `LinkGuardianDialog`).
 */
export function SubjectFormDialog({ mode, subject, open, onOpenChange }: SubjectFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormInput, unknown, SubjectCreateInput>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues:
      mode === "edit" && subject
        ? { name: subject.name, code: subject.code, is_active: subject.is_active }
        : { name: "", code: null, is_active: true },
  });

  async function onSubmit(values: SubjectCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createSubject.mutateAsync(values);
        toast.success("Subject created", { description: `${values.name} has been added.` });
      } else if (subject) {
        await updateSubject.mutateAsync({ id: subject.id, ...values });
        toast.success("Subject updated", {
          description: `Changes to ${values.name} have been saved.`,
        });
      }
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      // The create/update action throws this exact message for a duplicate name, surface it
      // as an inline field error instead of a generic banner (input is preserved either way
      // since we never call `reset()` here).
      if (message.toLowerCase().includes("already exists")) {
        setError("name", { type: "manual", message });
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New subject" : "Edit subject"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a subject taught across classes."
                : "Update this subject's name, code or status."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject_name">Name</Label>
              <Input
                id="subject_name"
                placeholder="Mathematics"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject_code">Code</Label>
              <Input
                id="subject_code"
                placeholder="MATH (optional)"
                aria-invalid={!!errors.code}
                {...register("code", { setValueAs: (v) => (v === "" ? null : v) })}
              />
              {errors.code && <p className="text-xs text-[var(--danger)]">{errors.code.message}</p>}
            </div>
            {/* Edit only. Creating a subject you are not teaching makes no sense, so the create
                form does not ask — the schema defaults it to active. */}
            {mode === "edit" && (
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
                      <Checkbox
                        checked={field.value ?? true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <span className="text-[var(--text)]">Currently taught</span>
                    </label>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Clear this when the school stops teaching the subject. Existing marks, class
                      assignments and past reports are kept — it just stops being offered.
                    </p>
                  </div>
                )}
              />
            )}
            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "create" ? "Create Subject" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
