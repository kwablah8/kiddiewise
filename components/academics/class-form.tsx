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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useClass, useCreateClass, useStaff, useUpdateClass } from "@/lib/queries/academics";
import { classCreateSchema, type ClassCreateInput, type ClassVM } from "@/lib/validators/academics";

// Sentinel for the Select's "no class teacher" row — the field itself stores `null`, but the
// Select needs a concrete string value to compare against (same pattern as `student-form.tsx`).
const NONE_VALUE = "__none__";

// `classCreateSchema` has `.default(null)`s on `capacity`/`class_teacher_id`, so its input type
// (what the form actually collects, incl. raw strings from number inputs before Zod coerces
// them) differs from its output type (what `createClass`/`updateClass` require). RHF needs
// both: defaultValues satisfy the input shape, but `onSubmit` receives the resolver's parsed
// *output* — same pattern as `student-form.tsx`.
type ClassFormInput = z.input<typeof classCreateSchema>;

interface ClassFormDialogProps {
  mode: "create" | "edit";
  /** Required when `mode === "edit"`. */
  classId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create/edit dialog for a class (RHF+Zod: name, level, capacity, class teacher). Form state
 * isn't reset on close; the caller remounts with a fresh `key` on every open (mirrors
 * `LinkGuardianDialog`).
 */
export function ClassFormDialog({ mode, classId, open, onOpenChange }: ClassFormDialogProps) {
  if (mode === "edit") {
    if (!classId) return null;
    return (
      <EditClassFormLoader classId={classId} open={open} onOpenChange={onOpenChange} />
    );
  }
  return <ClassFormFields mode="create" open={open} onOpenChange={onOpenChange} />;
}

/** Loads the record being edited so the dialog itself can show its own loading/error state. */
function EditClassFormLoader({
  classId,
  open,
  onOpenChange,
}: {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError, refetch } = useClass(classId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit class</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit class</DialogTitle>
          </DialogHeader>
          <ErrorState
            message={isError ? "Couldn't load this class." : "This class could not be found."}
            onRetry={isError ? () => refetch() : undefined}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ClassFormFields
      mode="edit"
      classId={classId}
      initialData={data}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

interface ClassFormFieldsProps {
  mode: "create" | "edit";
  classId?: string;
  initialData?: ClassVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ClassFormFields({ mode, classId, initialData, open, onOpenChange }: ClassFormFieldsProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: staff, isLoading: staffLoading } = useStaff();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();

  // Only active teachers are offered for a *new* assignment, but a class already assigned to an
  // inactive teacher keeps showing them (dropping them from the list would silently orphan the
  // field on open).
  const teacherOptions = (staff ?? []).filter(
    (s) => s.is_active || s.id === initialData?.class_teacher_id,
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormInput, unknown, ClassCreateInput>({
    resolver: zodResolver(classCreateSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          level: initialData.level,
          capacity: initialData.capacity,
          class_teacher_id: initialData.class_teacher_id,
        }
      : { name: "", level: "", capacity: null, class_teacher_id: null },
  });

  async function onSubmit(values: ClassCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createClass.mutateAsync(values);
        toast.success("Class created", { description: `${values.name} has been added.` });
      } else if (classId) {
        await updateClass.mutateAsync({ id: classId, ...values });
        toast.success("Class updated", { description: `Changes to ${values.name} have been saved.` });
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New class" : "Edit class"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a class, its level, capacity, and (optionally) a class teacher."
                : "Update this class's details."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="class_name">Name</Label>
                <Input
                  id="class_name"
                  placeholder="Basic 1"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="class_level">Level</Label>
                <Input
                  id="class_level"
                  placeholder="Primary, JHS…"
                  aria-invalid={!!errors.level}
                  {...register("level")}
                />
                {errors.level && (
                  <p className="text-xs text-[var(--danger)]">{errors.level.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class_capacity">Capacity</Label>
              <Input
                id="class_capacity"
                type="number"
                min={1}
                placeholder="e.g. 30 (optional)"
                aria-invalid={!!errors.capacity}
                {...register("capacity", { setValueAs: (v) => (v === "" ? null : v) })}
              />
              {errors.capacity && (
                <p className="text-xs text-[var(--danger)]">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class_teacher_id">Class teacher</Label>
              <Controller
                control={control}
                name="class_teacher_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                    disabled={staffLoading}
                  >
                    <SelectTrigger id="class_teacher_id" className="w-full" aria-invalid={!!errors.class_teacher_id}>
                      <SelectValue placeholder={staffLoading ? "Loading staff…" : undefined}>
                        {(v: string) => {
                          if (staffLoading) return "Loading staff…";
                          if (v === NONE_VALUE) return "No class teacher";
                          const t = teacherOptions.find((s) => s.id === v);
                          return t ? `${t.first_name} ${t.last_name}` : "No class teacher";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No class teacher</SelectItem>
                      {teacherOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.class_teacher_id && (
                <p className="text-xs text-[var(--danger)]">{errors.class_teacher_id.message}</p>
              )}
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "create" ? "Create Class" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
