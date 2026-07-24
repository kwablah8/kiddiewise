"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { StudentAvatar } from "./student-avatar";
import {
  useClassOptions,
  useCreateStudent,
  useLinkGuardian,
  useParents,
  useStudent,
  useUpdateStudent,
} from "@/lib/queries/people";
import { useInquiry, useSetInquiryStatus } from "@/lib/queries/inquiries";
import { inquiryToStudentPrefill, type InquiryParentNote } from "@/lib/inquiries";
import {
  studentCreateSchema,
  type StudentCreateInput,
  type StudentDetailVM,
  type ParentListItemVM,
} from "@/lib/validators/people";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "transferred", label: "Transferred" },
] as const;

// Sentinel for the Select's "no class" row — the field itself stores `null`, but base-ui
// Select items need a concrete string value to compare against.
const NONE_VALUE = "__none__";

// base-ui's <Select.Value> only auto-resolves a value's label once its matching <Select.Item>
// has actually mounted inside the popup (i.e. after the user has opened it) — so a value set
// via `defaultValues` (never opened yet) would otherwise render its raw enum string. Looking
// the label up ourselves sidesteps that timing dependency entirely.
function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// `studentCreateSchema` has `.default()`s on `enrollment_status`/`guardian_ids`, so its input
// type (what the form actually collects) makes them optional while its output type (what
// `createStudent`/`updateStudent` require) makes them required. RHF needs both: defaultValues
// satisfy the input shape, but `onSubmit` receives the resolver's parsed *output*.
type StudentFormInput = z.input<typeof studentCreateSchema>;

interface StudentFormProps {
  mode: "create" | "edit";
  /** Required when `mode === "edit"`. */
  studentId?: string;
  /** Create mode only — prefill this form from an accepted admissions inquiry (Convert flow). */
  fromInquiryId?: string;
}

/**
 * One shared form for create + edit (06-UI §6 "Forms"). Only how the record is loaded and where
 * the submit routes to differ by mode — the fields are identical. In create mode, an optional
 * `fromInquiryId` loads an inquiry and pre-fills the fields (Admissions → Convert to student).
 */
export function StudentForm({ mode, studentId, fromInquiryId }: StudentFormProps) {
  if (mode === "edit") {
    if (!studentId) return null;
    return <EditStudentForm studentId={studentId} />;
  }
  if (fromInquiryId) return <CreateFromInquiryForm inquiryId={fromInquiryId} />;
  return <StudentFormFields mode="create" />;
}

/**
 * Loads the inquiry (+ class options) being converted, then renders the shared create fields with
 * computed prefill — mirroring EditStudentForm's load-then-render shape. On a load failure it falls
 * back to a blank form with a toast, so Convert never dead-ends.
 */
function CreateFromInquiryForm({ inquiryId }: { inquiryId: string }) {
  const { data: inquiry, isLoading: inquiryLoading, isError } = useInquiry(inquiryId);
  const { data: classOptions, isLoading: classesLoading } = useClassOptions();

  const notFound = !inquiryLoading && !isError && !inquiry;
  const failed = isError || notFound;

  useEffect(() => {
    if (failed) {
      toast.error("Couldn't load that inquiry", {
        description: "Starting a blank student form instead.",
      });
    }
  }, [failed]);

  if (inquiryLoading || classesLoading) return <FormSkeleton />;
  if (failed || !inquiry) return <StudentFormFields mode="create" />;

  const { prefill, parentNote } = inquiryToStudentPrefill(inquiry, classOptions ?? []);
  return (
    <StudentFormFields
      mode="create"
      prefill={prefill}
      parentNote={parentNote}
      convertInquiryId={inquiryId}
    />
  );
}

/** Loads the record being edited, with its own loading/error/not-found states. */
function EditStudentForm({ studentId }: { studentId: string }) {
  const { data, isLoading, isError, refetch } = useStudent(studentId);

  if (isLoading) return <FormSkeleton />;

  if (isError) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load this student." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cardShellClass}>
        <EmptyState
          title="Student not found"
          description="This student may have been removed, or the link is incorrect."
          action={
            <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Students
            </Link>
          }
        />
      </div>
    );
  }

  return <StudentFormFields mode="edit" studentId={studentId} initialData={data} />;
}

function FormSkeleton() {
  return (
    <div className={cn(cardShellClass, "space-y-6")}>
      <SkeletonBlock className="h-14 w-14 rounded-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

interface StudentFormFieldsProps {
  mode: "create" | "edit";
  studentId?: string;
  initialData?: StudentDetailVM;
  /** Create mode — override the empty defaults with values mapped from an inquiry. */
  prefill?: Partial<StudentCreateInput>;
  /** Create mode — when set, the linked inquiry is marked `converted` after a successful save. */
  convertInquiryId?: string;
  /** Create mode — inquiry parent contact shown as a read-only note by the Guardians section. */
  parentNote?: InquiryParentNote;
}

function StudentFormFields({
  mode,
  studentId,
  initialData,
  prefill,
  convertInquiryId,
  parentNote,
}: StudentFormFieldsProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: classOptions, isLoading: classesLoading } = useClassOptions();
  const { data: parents, isLoading: parentsLoading } = useParents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const linkGuardian = useLinkGuardian();
  const setInquiryStatus = useSetInquiryStatus();

  // Guardians already linked (edit mode only) — shown as pre-checked + locked, since the
  // seam has no "unlink" action yet (only `useLinkGuardian`). Removing a guardian is a Unit C
  // (Link Parent dialog) concern.
  const alreadyLinkedIds = initialData?.guardians.map((g) => g.parent_profile_id) ?? [];

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput, unknown, StudentCreateInput>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: initialData
      ? {
          first_name: initialData.first_name,
          last_name: initialData.last_name,
          date_of_birth: initialData.date_of_birth,
          gender: initialData.gender,
          admission_no: initialData.admission_no,
          class_id: initialData.class_id,
          photo_url: initialData.photo_url,
          enrollment_status: initialData.enrollment_status,
          guardian_ids: alreadyLinkedIds,
        }
      : {
          first_name: prefill?.first_name ?? "",
          last_name: prefill?.last_name ?? "",
          date_of_birth: "",
          gender: "male",
          admission_no: "",
          class_id: prefill?.class_id ?? null,
          photo_url: null,
          enrollment_status: "active",
          guardian_ids: [],
        },
  });

  // `useWatch` (not `formInstance.watch()`) so the React Compiler can still memoize this
  // component — `watch()` returns a function it can't safely track.
  const firstName = useWatch({ control, name: "first_name" });
  const lastName = useWatch({ control, name: "last_name" });
  const photoUrl = useWatch({ control, name: "photo_url" });

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // SEAM: real upload to Storage later — this only creates a local, in-memory preview URL.
    const url = URL.createObjectURL(file);
    setValue("photo_url", url, { shouldDirty: true });
  }

  async function linkNewGuardians(targetStudentId: string, selectedIds: string[]) {
    const newIds = selectedIds.filter((id) => !alreadyLinkedIds.includes(id));
    for (const parent_profile_id of newIds) {
      // Bulk-picked guardians default to relationship "guardian", marked primary only when
      // they're the very first guardian this student has ever had. Per-guardian relationship
      // + primary designation is the explicit Link Parent flow (Unit C).
      await linkGuardian.mutateAsync({
        student_id: targetStudentId,
        parent_profile_id,
        relationship: "guardian",
        is_primary: alreadyLinkedIds.length === 0 && newIds.length === 1,
      });
    }
  }

  async function onSubmit(values: StudentCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        const { id } = await createStudent.mutateAsync(values);
        await linkNewGuardians(id, values.guardian_ids);
        // SEAM: create-student + mark-converted are two non-atomic writes here. On the mock a
        // partial failure only softens the toast, but at Supabase integration this pair must be
        // one transaction (or made idempotent on the inquiry id) so a mid-flow failure can't leave
        // a student created with the inquiry still `accepted` (re-convertible → duplicate student).
        if (convertInquiryId) {
          try {
            await setInquiryStatus.mutateAsync({ id: convertInquiryId, status: "converted" });
            toast.success("Student enrolled from inquiry", {
              description: `${values.first_name} ${values.last_name} was added and the inquiry marked converted.`,
            });
          } catch {
            // The inquiry wasn't in a convertible state — the student is still created; don't fail.
            toast.success("Student added", {
              description: `${values.first_name} ${values.last_name} was created, but the inquiry couldn't be marked converted.`,
            });
          }
        } else {
          toast.success("Student added", {
            description: `${values.first_name} ${values.last_name} has been enrolled.`,
          });
        }
        router.push("/students");
      } else if (studentId) {
        await updateStudent.mutateAsync({ id: studentId, ...values });
        await linkNewGuardians(studentId, values.guardian_ids);
        toast.success("Student updated", {
          description: `Changes to ${values.first_name} ${values.last_name} have been saved.`,
        });
        router.push(`/students/${studentId}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      // The create/update action throws this exact message for a duplicate admission_no —
      // surface it as an inline field error instead of a generic banner (input is preserved
      // either way since we never call `reset()` here).
      if (message.toLowerCase().includes("admission number")) {
        setError("admission_no", { type: "manual", message });
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn(cardShellClass, "space-y-8")}
    >
      <section className="flex items-center gap-4">
        <StudentAvatar
          firstName={firstName || "?"}
          lastName={lastName || "?"}
          photoUrl={photoUrl}
          size="lg"
        />
        <div>
          <Label
            htmlFor="photo"
            className="cursor-pointer text-sm font-medium text-[var(--primary)] hover:underline"
          >
            {photoUrl ? "Change photo" : "Upload photo"}
          </Label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            JPG or PNG. Shown on the roster and this student&apos;s profile.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">Personal details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" aria-invalid={!!errors.first_name} {...register("first_name")} />
            {errors.first_name && (
              <p className="text-xs text-[var(--danger)]">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" aria-invalid={!!errors.last_name} {...register("last_name")} />
            {errors.last_name && (
              <p className="text-xs text-[var(--danger)]">{errors.last_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              aria-invalid={!!errors.date_of_birth}
              {...register("date_of_birth")}
            />
            {errors.date_of_birth && (
              <p className="text-xs text-[var(--danger)]">{errors.date_of_birth.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="gender" className="w-full" aria-invalid={!!errors.gender}>
                    <SelectValue placeholder="Select gender">
                      {(v: string) => labelFor(GENDER_OPTIONS, v)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-xs text-[var(--danger)]">{errors.gender.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">Enrollment</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="admission_no">Admission No.</Label>
            <Input
              id="admission_no"
              aria-invalid={!!errors.admission_no}
              {...register("admission_no")}
            />
            {errors.admission_no && (
              <p className="text-xs text-[var(--danger)]">{errors.admission_no.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="enrollment_status">Enrollment status</Label>
            <Controller
              control={control}
              name="enrollment_status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="enrollment_status"
                    className="w-full"
                    aria-invalid={!!errors.enrollment_status}
                  >
                    <SelectValue placeholder="Select status">
                      {(v: string) => labelFor(STATUS_OPTIONS, v)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.enrollment_status && (
              <p className="text-xs text-[var(--danger)]">{errors.enrollment_status.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="class_id">Class</Label>
            <Controller
              control={control}
              name="class_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? NONE_VALUE}
                  onValueChange={(v) => field.onChange(v === NONE_VALUE ? null : v)}
                  disabled={classesLoading}
                >
                  <SelectTrigger
                    id="class_id"
                    className="w-full sm:w-64"
                    aria-invalid={!!errors.class_id}
                  >
                    <SelectValue placeholder={classesLoading ? "Loading classes…" : undefined}>
                      {(v: string) => {
                        if (classesLoading || !classOptions) return "Loading classes…";
                        if (v === NONE_VALUE) return "No class assigned";
                        const cls = classOptions.find((c) => c.id === v);
                        return cls ? `${cls.name} (${cls.level})` : "No class assigned";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No class assigned</SelectItem>
                    {classOptions?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.class_id && (
              <p className="text-xs text-[var(--danger)]">{errors.class_id.message}</p>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              Assigning a class creates an enrollment for the active academic year.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">Guardians</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Link one or more existing parent records to this student.
        </p>
        {parentNote && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm">
            <p className="font-medium text-[var(--text)]">From inquiry — parent contact</p>
            <p className="text-[var(--muted-foreground)]">
              {parentNote.name} · {parentNote.email}
              {parentNote.phone ? ` · ${parentNote.phone}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Create this parent from the Parents page, then link them below.
            </p>
          </div>
        )}
        <Controller
          control={control}
          name="guardian_ids"
          render={({ field }) => (
            <GuardianPicker
              parents={parents ?? []}
              isLoading={parentsLoading}
              selected={field.value ?? []}
              lockedIds={alreadyLinkedIds}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
        <Link
          href={mode === "edit" && studentId ? `/students/${studentId}` : "/students"}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {mode === "create" ? "Add Student" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

interface GuardianPickerProps {
  parents: ParentListItemVM[];
  isLoading: boolean;
  selected: string[];
  lockedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Checkbox list of existing parents (06-UI restraint over a heavier combobox for ~10 rows). */
function GuardianPicker({ parents, isLoading, selected, lockedIds, onChange }: GuardianPickerProps) {
  function toggle(id: string) {
    if (lockedIds.includes(id)) return;
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (parents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--muted-foreground)]">
        No parent records yet. Create one from the Parents page first.
      </p>
    );
  }

  return (
    <div className="max-h-56 divide-y divide-[var(--border)] overflow-y-auto rounded-lg border border-input">
      {parents.map((p) => {
        const checked = selected.includes(p.id);
        const locked = lockedIds.includes(p.id);
        return (
          <label
            key={p.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm",
              locked ? "cursor-default opacity-70" : "cursor-pointer hover:bg-[var(--bg)]",
            )}
          >
            <Checkbox checked={checked} disabled={locked} onCheckedChange={() => toggle(p.id)} />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium text-[var(--text)]">
                {p.first_name} {p.last_name}
              </span>{" "}
              <span className="text-[var(--muted-foreground)]">{p.email}</span>
            </span>
            {locked && (
              <span className="shrink-0 text-xs text-[var(--muted-foreground)]">Linked</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
