"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import { getRoster } from "@/lib/data/attendance";
import { saveAttendance as saveAttendanceAction } from "@/lib/actions/attendance";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic CALL in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it — it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const saveAttendance = mutate(saveAttendanceAction);

export const useRoster = (classId: string | null, date: string) =>
  useQuery({
    queryKey: queryKeys.attendance.roster(classId ?? "", date),
    queryFn: () => getRoster(classId as string, date),
    enabled: !!classId && !!date,
  });

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveAttendance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
