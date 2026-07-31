"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/assessments";
import {
  createAssessment as createAssessmentAction,
  updateAssessment as updateAssessmentAction,
  deleteAssessment as deleteAssessmentAction,
} from "@/lib/actions/assessments";
import { saveResults as saveResultsAction } from "@/lib/actions/results";
import type { AssessmentFilters } from "@/lib/validators/assessments";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic CALL in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it — it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const createAssessment = mutate(createAssessmentAction);
const updateAssessment = mutate(updateAssessmentAction);
const deleteAssessment = mutate(deleteAssessmentAction);
const saveResults = mutate(saveResultsAction);

export const useAssessments = (filters: AssessmentFilters = {}) =>
  useQuery({
    queryKey: queryKeys.assessments.list(filters),
    queryFn: () => data.listAssessments(filters),
  });

export const useAssessment = (id: string) =>
  useQuery({
    queryKey: queryKeys.assessments.detail(id),
    queryFn: () => data.getAssessment(id),
  });

export const useTeacherAssessments = (teacherId: string) =>
  useQuery({
    queryKey: queryKeys.assessments.mine(teacherId),
    queryFn: () => data.listTeacherAssessments(teacherId),
  });

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssessment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

export function useUpdateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAssessment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

// Deleting an assessment can take draft results with it, so the student academics view and the
// report sheet's live figures refetch too.
export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export const useScoreSheet = (assessmentId: string | null) =>
  useQuery({
    queryKey: queryKeys.assessments.scoreSheet(assessmentId ?? ""),
    queryFn: () => data.getScoreSheet(assessmentId as string),
    enabled: !!assessmentId,
  });

/**
 * Save marks. Invalidates the whole `assessments` tree rather than one key: the same rows drive the
 * teacher's list (its result count and submitted state), the admin's assessment detail, and the
 * student's academic record — so a narrow invalidation would leave stale figures on screen.
 */
export function useSaveResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveResults,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
