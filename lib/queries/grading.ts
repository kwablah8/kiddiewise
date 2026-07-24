"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/grading";
import * as actions from "@/lib/actions/grading";

export const useGradeBands = () =>
  useQuery({ queryKey: queryKeys.grading.bands, queryFn: data.listGradeBands });

export const useAssessmentTypes = () =>
  useQuery({ queryKey: queryKeys.grading.types, queryFn: data.listAssessmentTypes });

// Grade-band mutations invalidate bands; assessment detail derives grades from bands, so also
// invalidate any cached assessment detail (prefix ["assessments"]).
function useBandMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.grading.bands });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
export const useCreateGradeBand = () => useBandMutation(actions.createGradeBand);
export const useUpdateGradeBand = () => useBandMutation(actions.updateGradeBand);
export const useDeleteGradeBand = () => useBandMutation(actions.deleteGradeBand);

function useTypeMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.grading.types });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
export const useCreateAssessmentType = () => useTypeMutation(actions.createAssessmentType);
export const useUpdateAssessmentType = () => useTypeMutation(actions.updateAssessmentType);
export const useDeleteAssessmentType = () => useTypeMutation(actions.deleteAssessmentType);
