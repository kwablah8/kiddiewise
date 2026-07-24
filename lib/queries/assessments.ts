"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/assessments";
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
