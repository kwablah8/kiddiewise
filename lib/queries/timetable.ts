"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate, type ActionResult } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/timetable";
import * as actions from "@/lib/actions/timetable";

// Bound to a const rather than inlined at `mutationFn`: inlining a generic call in a
// contextually-typed position defeats useMutation's inference of the variables type (see
// lib/queries/lesson-notes.ts for the same note).
const saveClassTimetable = mutate(actions.saveClassTimetable);

export const usePeriods = () =>
  useQuery({ queryKey: queryKeys.timetable.periods, queryFn: data.listPeriods });

export const useClassTimetable = (classId: string) =>
  useQuery({
    queryKey: queryKeys.timetable.classGrid(classId),
    queryFn: () => data.getClassTimetable(classId),
    enabled: !!classId,
  });

function usePeriodMutation<TArgs>(fn: (a: TArgs) => Promise<ActionResult<unknown>>) {
  const qc = useQueryClient();
  const mutationFn = mutate(fn);
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.timetable.periods }),
  });
}
export const useCreatePeriod = () => usePeriodMutation(actions.createPeriod);
export const useUpdatePeriod = () => usePeriodMutation(actions.updatePeriod);
// A deleted period cascades out of every class's grid (migration 0041), so any cached class
// timetable could now be showing a slot that no longer exists — invalidate the whole subtree.
export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mutate(actions.deletePeriod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.periods });
      qc.invalidateQueries({ queryKey: ["timetable", "class"] });
    },
  });
}

export function useSaveClassTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveClassTimetable,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.classGrid(variables.class_id) });
    },
  });
}
