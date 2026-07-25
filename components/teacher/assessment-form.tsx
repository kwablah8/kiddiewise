"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { useAssignmentsForStaff, useActiveContext, useTerms } from "@/lib/queries/academics";
import { useAssessmentTypes } from "@/lib/queries/grading";
import { useCreateAssessment } from "@/lib/queries/assessments";
import { assessmentCreateSchema } from "@/lib/validators/assessments";

type FormInput = z.input<typeof assessmentCreateSchema>;

interface AssessmentFormDialogProps {
  teacherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentFormDialog({ teacherId, open, onOpenChange }: AssessmentFormDialogProps) {
  const { data: assignments } = useAssignmentsForStaff(teacherId);
  const { data: types } = useAssessmentTypes();
  const { data: terms } = useTerms();
  const { data: active } = useActiveContext();
  const createAssessment = useCreateAssessment();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, z.output<typeof assessmentCreateSchema>>({
    resolver: zodResolver(assessmentCreateSchema),
    defaultValues: {
      class_id: "",
      subject_id: "",
      assessment_type_id: "",
      term_id: active?.active_term?.id ?? "",
      title: "",
      max_score: 0,
      date: null,
    },
  });

  const classId = useWatch({ control, name: "class_id" });

  // Distinct classes and (for the chosen class) subjects, both from the teacher's own class_subjects.
  const classes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments ?? []) if (!seen.has(a.class_id)) seen.set(a.class_id, a.class_name);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [assignments]);
  const subjects = useMemo(
    () =>
      (assignments ?? [])
        .filter((a) => a.class_id === classId)
        .map((a) => ({ id: a.subject_id, name: a.subject_name })),
    [assignments, classId],
  );

  async function onSubmit(values: z.output<typeof assessmentCreateSchema>) {
    try {
      await createAssessment.mutateAsync(values);
      toast.success("Assessment created", { description: values.title });
      onOpenChange(false);
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>New assessment</DialogTitle>
            <DialogDescription>A graded item for one of your class subjects.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Controller
                  control={control}
                  name="class_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v ?? "");
                        setValue("subject_id", ""); // reset dependent subject
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.class_id}>
                        <SelectValue placeholder="Select a class">
                          {(v: string) => classes.find((c) => c.id === v)?.name ?? "Select a class"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.class_id && <p className="text-xs text-[var(--danger)]">{errors.class_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Controller
                  control={control}
                  name="subject_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")} disabled={!classId}>
                      <SelectTrigger aria-invalid={!!errors.subject_id}>
                        <SelectValue placeholder={classId ? "Select a subject" : "Pick a class first"}>
                          {(v: string) => subjects.find((s) => s.id === v)?.name ?? "Select a subject"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.subject_id && <p className="text-xs text-[var(--danger)]">{errors.subject_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  control={control}
                  name="assessment_type_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                      <SelectTrigger aria-invalid={!!errors.assessment_type_id}>
                        <SelectValue placeholder="Select a type">
                          {(v: string) => (types ?? []).find((t) => t.id === v)?.name ?? "Select a type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(types ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.assessment_type_id && (
                  <p className="text-xs text-[var(--danger)]">{errors.assessment_type_id.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Controller
                  control={control}
                  name="term_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                      <SelectTrigger aria-invalid={!!errors.term_id}>
                        <SelectValue placeholder="Select a term">
                          {(v: string) => (terms ?? []).find((t) => t.id === v)?.name ?? "Select a term"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(terms ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.term_id && <p className="text-xs text-[var(--danger)]">{errors.term_id.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Mid-Term Exam" aria-invalid={!!errors.title} {...register("title")} />
              {errors.title && <p className="text-xs text-[var(--danger)]">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max_score">Max score</Label>
                <Input
                  id="max_score"
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.max_score}
                  {...register("max_score")}
                />
                {errors.max_score && <p className="text-xs text-[var(--danger)]">{errors.max_score.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date (optional)</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>
            </div>

            {errors.root && <p className="text-sm text-[var(--danger)]">{errors.root.message}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Create assessment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
