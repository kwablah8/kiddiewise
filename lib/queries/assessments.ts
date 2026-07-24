"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/assessments";
import { createAssessment } from "@/lib/actions/assessments";
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
