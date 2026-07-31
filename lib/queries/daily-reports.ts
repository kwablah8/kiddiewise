"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/daily-reports";
import * as actions from "@/lib/actions/daily-reports";

// Bound to consts so useMutation infers the variables type — see lib/queries/people.ts.
const saveParentDailyReport = mutate(actions.saveParentDailyReport);
const saveTeacherDailyReport = mutate(actions.saveTeacherDailyReport);

export const useDailyReport = (studentId: string | null, date: string) =>
  useQuery({
    queryKey: queryKeys.dailyReports.report(studentId ?? "", date),
    queryFn: () => data.getDailyReport(studentId as string, date),
    enabled: !!studentId && !!date,
  });

export const useClassDailyStatus = (classId: string | null, date: string) =>
  useQuery({
    queryKey: queryKeys.dailyReports.classStatus(classId ?? "", date),
    queryFn: () => data.getClassDailyStatus(classId as string, date),
    enabled: !!classId && !!date,
  });

// One prefix invalidation covers the per-child report AND the class status list — a save flips
// the submitted flag the other portal's list renders.
export function useSaveParentDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveParentDailyReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-reports"] }),
  });
}

export function useSaveTeacherDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveTeacherDailyReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-reports"] }),
  });
}
