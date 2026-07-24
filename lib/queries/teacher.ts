"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { getTeacherDashboard } from "@/lib/data/teacher";

export const useTeacherDashboard = (teacherId: string) =>
  useQuery({
    queryKey: queryKeys.teacher.dashboard(teacherId),
    queryFn: () => getTeacherDashboard(teacherId),
  });
