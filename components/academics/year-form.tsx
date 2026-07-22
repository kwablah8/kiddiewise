"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { useCreateYear } from "@/lib/queries/academics";
import { academicYearCreateSchema, type AcademicYearCreateInput } from "@/lib/validators/academics";

interface YearFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "New Year" dialog (create-only — years have no edit action in this slice). Form state isn't
 * reset on close; the caller remounts with a fresh `key` on every open (mirrors
 * `LinkGuardianDialog`), which is what gives every open a clean form.
 */
export function YearFormDialog({ open, onOpenChange }: YearFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createYear = useCreateYear();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcademicYearCreateInput>({
    resolver: zodResolver(academicYearCreateSchema),
    defaultValues: { name: "", start_date: "", end_date: "" },
  });

  async function onSubmit(values: AcademicYearCreateInput) {
    setSubmitError(null);
    try {
      await createYear.mutateAsync(values);
      toast.success("Academic year created", {
        description: `${values.name} has been added. Set it active when you're ready.`,
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
            <DialogTitle>New academic year</DialogTitle>
            <DialogDescription>
              Add an academic year, then set it active from the Years panel.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="year_name">Name</Label>
              <Input
                id="year_name"
                placeholder="2026/2027"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-[var(--danger)]">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year_start">Start date</Label>
                <Input
                  id="year_start"
                  type="date"
                  aria-invalid={!!errors.start_date}
                  {...register("start_date")}
                />
                {errors.start_date && (
                  <p className="text-xs text-[var(--danger)]">{errors.start_date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year_end">End date</Label>
                <Input
                  id="year_end"
                  type="date"
                  aria-invalid={!!errors.end_date}
                  {...register("end_date")}
                />
                {errors.end_date && (
                  <p className="text-xs text-[var(--danger)]">{errors.end_date.message}</p>
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
              Create Year
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
