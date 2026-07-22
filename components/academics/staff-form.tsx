"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useCreateStaff, useStaffMember, useUpdateStaff } from "@/lib/queries/academics";
import { staffCreateSchema, type StaffCreateInput, type StaffVM } from "@/lib/validators/academics";

// `staffCreateSchema` has `.default(null)`s on `phone`/`department`, so its input type (what the
// form collects) differs from its output type (what create/update require) — same pattern as
// `student-form.tsx` / `class-form.tsx`.
type StaffFormInput = z.input<typeof staffCreateSchema>;

interface StaffFormDialogProps {
  mode: "create" | "edit";
  /** Required when `mode === "edit"`. */
  staffId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create/edit dialog for a staff (teacher) record (RHF+Zod: first/last name, email, phone,
 * department). `staff_no` is auto-assigned server-side on create — never a form field — and
 * shown read-only on edit. Form state isn't reset on close; the caller remounts with a fresh
 * `key` on every open (mirrors `LinkGuardianDialog`).
 */
export function StaffFormDialog({ mode, staffId, open, onOpenChange }: StaffFormDialogProps) {
  if (mode === "edit") {
    if (!staffId) return null;
    return <EditStaffFormLoader staffId={staffId} open={open} onOpenChange={onOpenChange} />;
  }
  return <StaffFormFields mode="create" open={open} onOpenChange={onOpenChange} />;
}

/** Loads the record being edited so the dialog itself can show its own loading/error state. */
function EditStaffFormLoader({
  staffId,
  open,
  onOpenChange,
}: {
  staffId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError, refetch } = useStaffMember(staffId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
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
            <DialogTitle>Edit staff</DialogTitle>
          </DialogHeader>
          <ErrorState
            message={isError ? "Couldn't load this staff member." : "This staff member could not be found."}
            onRetry={isError ? () => refetch() : undefined}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <StaffFormFields
      mode="edit"
      staffId={staffId}
      initialData={data}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

interface StaffFormFieldsProps {
  mode: "create" | "edit";
  staffId?: string;
  initialData?: StaffVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StaffFormFields({ mode, staffId, initialData, open, onOpenChange }: StaffFormFieldsProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormInput, unknown, StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: initialData
      ? {
          first_name: initialData.first_name,
          last_name: initialData.last_name,
          email: initialData.email,
          phone: initialData.phone,
          department: initialData.department,
        }
      : { first_name: "", last_name: "", email: "", phone: null, department: null },
  });

  async function onSubmit(values: StaffCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        // SEAM: real path provisions an auth account via Edge Function provision-user; here it
        // adds a staff record (staff_no auto-assigned by the action, never client input).
        await createStaff.mutateAsync(values);
        toast.success("Staff created", {
          description: `${values.first_name} ${values.last_name} has been added.`,
        });
      } else if (staffId) {
        await updateStaff.mutateAsync({ id: staffId, ...values });
        toast.success("Staff updated", {
          description: `Changes to ${values.first_name} ${values.last_name} have been saved.`,
        });
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
            <DialogTitle>{mode === "create" ? "New staff" : "Edit staff"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a staff member. A staff number is assigned automatically."
                : "Update this staff member's details."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* staff_no is never an input — auto-assigned on create, immutable after. Shown
                read-only here only in edit mode (there's nothing to show yet on create). */}
            {mode === "edit" && initialData && (
              <div className="space-y-1.5">
                <Label>Staff No.</Label>
                <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)]">
                  {initialData.staff_no}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff_first_name">First name</Label>
                <Input
                  id="staff_first_name"
                  aria-invalid={!!errors.first_name}
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-xs text-[var(--danger)]">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff_last_name">Last name</Label>
                <Input
                  id="staff_last_name"
                  aria-invalid={!!errors.last_name}
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-xs text-[var(--danger)]">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff_email">Email</Label>
              <Input
                id="staff_email"
                type="email"
                placeholder="name@school.edu.gh"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  placeholder="Optional"
                  aria-invalid={!!errors.phone}
                  {...register("phone", { setValueAs: (v) => (v === "" ? null : v) })}
                />
                {errors.phone && <p className="text-xs text-[var(--danger)]">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff_department">Department</Label>
                <Input
                  id="staff_department"
                  placeholder="Optional"
                  aria-invalid={!!errors.department}
                  {...register("department", { setValueAs: (v) => (v === "" ? null : v) })}
                />
                {errors.department && (
                  <p className="text-xs text-[var(--danger)]">{errors.department.message}</p>
                )}
              </div>
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "create" ? "Create Staff" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
