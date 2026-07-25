"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/assessments";
import { createAssessment } from "@/lib/actions/assessments";
import { saveResults } from "@/lib/actions/results";
import type { AssessmentFilters } from "@/lib/validators/assessments";

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
