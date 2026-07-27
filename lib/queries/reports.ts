"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate, type ActionResult } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import { getReportSheet } from "@/lib/data/reports";
import { generateReports, setReportComments, setReportsPublished } from "@/lib/actions/reports";

export const useReportSheet = (classId: string | null, termId: string | null) =>
  useQuery({
    queryKey: queryKeys.reports.sheet(classId ?? "", termId ?? ""),
    queryFn: () => getReportSheet(classId as string, termId as string),
    enabled: !!classId && !!termId,
  });

/**
 * All three mutations invalidate the whole `reports` tree. Generating changes every row's figures and
 * positions at once, and publishing changes what the parent portal can see — so a narrow invalidation
 * would leave the sheet disagreeing with the database.
 */
function useReportMutation<TInput, TOutput>(fn: (input: TInput) => Promise<ActionResult<TOutput>>) {
  const qc = useQueryClient();
  const mutationFn = mutate(fn);
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["parent"] });
    },
  });
}

export const useGenerateReports = () => useReportMutation(generateReports);
export const useSetReportComments = () => useReportMutation(setReportComments);
export const useSetReportsPublished = () => useReportMutation(setReportsPublished);
