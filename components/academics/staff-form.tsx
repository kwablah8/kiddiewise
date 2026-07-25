"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Info, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import { useCreateStaff, useStaffMember, useUpdateStaff } from "@/lib/queries/academics";
import { staffCreateSchema, type StaffCreateInput, type StaffVM } from "@/lib/validators/academics";

// `staffCreateSchema` has `.default(...)`s on the optional fields, so its input type (what the
// form collects) differs from its output type (what create/update require) — same pattern as
// `student-form.tsx` / `class-form.tsx`.
type StaffFormInput = z.input<typeof staffCreateSchema>;

const GENDER_NONE = "__none__";
const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "school_admin", label: "Administrator" },
] as const;
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

function roleLabel(v: string): string {
  return ROLE_OPTIONS.find((o) => o.value === v)?.label ?? "Teacher";
}
function genderLabel(v: string): string {
  if (v === GENDER_NONE) return "Not specified";
  return GENDER_OPTIONS.find((o) => o.value === v)?.label ?? "Not specified";
}

interface StaffFormDialogProps {
  mode: "create" | "edit";
  /** Required when `mode === "edit"`. */
  staffId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create/edit dialog for a staff record. Captures role (teacher / administrator), identity,
 * employment and contact details. `staff_no` is auto-assigned server-side on create with a
 * role-aware prefix (TCH-/ADM-) — never a form field — and shown read-only on edit. Teachers'
 * classes/subjects are assigned separately on a class's page (a hint points there). Form state
 * isn't reset on close; the caller remounts with a fresh `key` on every open.
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
        <DialogContent className="sm:max-w-lg">
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormInput, unknown, StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: initialData
      ? {
          first_name: initialData.first_name,
          last_name: initialData.last_name,
          email: initialData.email,
          role: initialData.role,
          phone: initialData.phone,
          position: initialData.position,
          department: initialData.department,
          gender: initialData.gender,
          date_of_birth: initialData.date_of_birth,
          hire_date: initialData.hire_date,
          qualification: initialData.qualification,
        }
      : {
          first_name: "",
          last_name: "",
          email: "",
          role: "teacher",
          phone: null,
          position: null,
          department: null,
          gender: null,
          date_of_birth: null,
          hire_date: null,
          qualification: null,
        },
  });

  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: StaffCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        // The action invites an auth account, then inserts the profile. staff_no is auto-assigned
        // server-side, never client input.
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New staff" : "Edit staff"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a staff member. A staff number (TCH-… / ADM-…) is assigned automatically by role."
                : "Update this staff member's details."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[62vh] space-y-6 overflow-y-auto pr-1">
            {/* staff_no is never an input — auto-assigned on create, immutable after. Shown
                read-only here only in edit mode. */}
            {mode === "edit" && initialData && (
              <FieldRow>
                <ReadOnlyField label="Staff No." value={initialData.staff_no} />
              </FieldRow>
            )}

            {/* --- Role --- */}
            <Section title="Role">
              <FieldRow>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_role">Role</Label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value ?? "teacher"} onValueChange={(v) => field.onChange(v)}>
                        <SelectTrigger id="staff_role" className="w-full">
                          <SelectValue>{(v: string) => roleLabel(v)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_position">Position</Label>
                  <Input
                    id="staff_position"
                    placeholder="e.g. Head Teacher"
                    {...register("position", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </div>
              </FieldRow>

              {role === "teacher" && (
                <p className="flex items-start gap-2 rounded-lg bg-[var(--bg)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Classes &amp; subjects are assigned from a class&apos;s page (Classes → a class →
                  Assignments) after the teacher is created.
                </p>
              )}
            </Section>

            {/* --- Identity --- */}
            <Section title="Identity">
              <FieldRow>
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
              </FieldRow>

              <FieldRow>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_gender">Gender</Label>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? GENDER_NONE}
                        onValueChange={(v) => field.onChange(v === GENDER_NONE ? null : v)}
                      >
                        <SelectTrigger id="staff_gender" className="w-full">
                          <SelectValue>{(v: string) => genderLabel(v)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={GENDER_NONE}>Not specified</SelectItem>
                          {GENDER_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_dob">Date of birth</Label>
                  <Input
                    id="staff_dob"
                    type="date"
                    {...register("date_of_birth", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </div>
              </FieldRow>
            </Section>

            {/* --- Employment --- */}
            <Section title="Employment">
              <FieldRow>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_department">Department</Label>
                  <Input
                    id="staff_department"
                    placeholder="Optional"
                    {...register("department", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff_hire_date">Employment date</Label>
                  <Input
                    id="staff_hire_date"
                    type="date"
                    {...register("hire_date", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </div>
              </FieldRow>
              <div className="space-y-1.5">
                <Label htmlFor="staff_qualification">Qualification</Label>
                <Input
                  id="staff_qualification"
                  placeholder="e.g. B.Ed Mathematics"
                  {...register("qualification", { setValueAs: (v) => (v === "" ? null : v) })}
                />
              </div>
            </Section>

            {/* --- Contact --- */}
            <Section title="Contact">
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
              <div className="space-y-1.5">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  placeholder="Optional"
                  {...register("phone", { setValueAs: (v) => (v === "" ? null : v) })}
                />
              </div>
            </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)]">
        {value}
      </p>
    </div>
  );
}
