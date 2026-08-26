"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useLinkGuardian, useParents } from "@/lib/queries/people";
import { linkGuardianSchema, type LinkGuardianInput } from "@/lib/validators/people";

const RELATIONSHIP_OPTIONS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
] as const;

function labelFor(value: string): string {
  return RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

interface LinkGuardianDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parent ids already linked to this student, hidden from the picker. */
  excludeParentIds?: string[];
}

/**
 * Link-an-existing-parent-to-a-student dialog, opened from the student detail Guardians
 * panel (06-UI §6 "Forms"). `useLinkGuardian` invalidates the student detail + parents keys
 * on success, so both the Guardians panel and the parent's children list stay in sync.
 *
 * Form state isn't reset on close, the caller remounts this component with a fresh `key`
 * each time it opens (see `StudentProfile`), which is what gives every open a clean form
 * without an effect-driven reset.
 */
export function LinkGuardianDialog({
  studentId,
  open,
  onOpenChange,
  excludeParentIds = [],
}: LinkGuardianDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: parents, isLoading: parentsLoading } = useParents();
  const linkGuardian = useLinkGuardian();

  const availableParents = (parents ?? []).filter((p) => !excludeParentIds.includes(p.id));

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LinkGuardianInput>({
    resolver: zodResolver(linkGuardianSchema),
    defaultValues: {
      student_id: studentId,
      parent_profile_id: "",
      relationship: "guardian",
      is_primary: false,
    },
  });

  // `linkGuardianSchema` accepts any string (incl. empty) for `parent_profile_id`; it's the
  // final Server Action contract, not a form-only rule, so an unselected parent is guarded
  // here by disabling submit rather than by a resolver error.
  const selectedParentId = useWatch({ control, name: "parent_profile_id" });

  async function onSubmit(values: LinkGuardianInput) {
    setSubmitError(null);
    try {
      await linkGuardian.mutateAsync(values);
      const parent = availableParents.find((p) => p.id === values.parent_profile_id);
      toast.success("Guardian linked", {
        description: parent
          ? `${parent.first_name} ${parent.last_name} has been linked as a guardian.`
          : "The guardian has been linked.",
      });
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
            <DialogTitle>Link parent</DialogTitle>
            <DialogDescription>
              Link an existing parent record to this student as a guardian.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="parent_profile_id">Parent</Label>
              {parentsLoading ? (
                <SkeletonBlock className="h-8 w-full" />
              ) : availableParents.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-sm text-[var(--muted-foreground)]">
                  {parents && parents.length > 0
                    ? "All existing parents are already linked to this student."
                    : "No parent records yet."}{" "}
                  <Link href="/parents/new" className="font-medium text-[var(--primary)] hover:underline">
                    Create one
                  </Link>
                  .
                </p>
              ) : (
                <Controller
                  control={control}
                  name="parent_profile_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="parent_profile_id"
                        className="w-full"
                        aria-invalid={!!errors.parent_profile_id}
                      >
                        <SelectValue placeholder="Select a parent">
                          {(v: string) => {
                            const p = availableParents.find((x) => x.id === v);
                            return p ? `${p.first_name} ${p.last_name}` : "Select a parent";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableParents.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} · {p.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.parent_profile_id && (
                <p className="text-xs text-[var(--danger)]">
                  {errors.parent_profile_id.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relationship">Relationship</Label>
              <Controller
                control={control}
                name="relationship"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="relationship"
                      className="w-full"
                      aria-invalid={!!errors.relationship}
                    >
                      <SelectValue placeholder="Select relationship">
                        {(v: string) => labelFor(v)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.relationship && (
                <p className="text-xs text-[var(--danger)]">{errors.relationship.message}</p>
              )}
            </div>

            <Controller
              control={control}
              name="is_primary"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span className="text-[var(--text)]">Set as primary guardian</span>
                </label>
              )}
            />

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
            <input type="hidden" {...register("student_id")} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || availableParents.length === 0 || !selectedParentId}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Link Parent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
