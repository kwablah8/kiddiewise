"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { getTeacherDashboard, listRegisterClasses, listTeacherClasses } from "@/lib/data/teacher";

export const useTeacherDashboard = (teacherId: string) =>
  useQuery({
    queryKey: queryKeys.teacher.dashboard(teacherId),
    queryFn: () => getTeacherDashboard(teacherId),
  });

export const useTeacherClasses = (teacherId: string) =>
  useQuery({
    queryKey: queryKeys.teacher.classes(teacherId),
    queryFn: () => listTeacherClasses(teacherId),
  });

export const useRegisterClasses = (teacherId: string) =>
  useQuery({
    queryKey: queryKeys.teacher.registerClasses(teacherId),
    queryFn: () => listRegisterClasses(teacherId),
  });
