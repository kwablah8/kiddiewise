"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { getRoster } from "@/lib/data/attendance";
import { saveAttendance } from "@/lib/actions/attendance";

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
