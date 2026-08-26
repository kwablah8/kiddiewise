"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { getSchool } from "@/lib/data/school";

/**
 * The caller's school. Cached generously, a school's name and contact details change roughly never,
 * and this is read by anything that has to identify the school to a parent.
 */
export const useSchool = () =>
  useQuery({
    queryKey: queryKeys.school.current,
    queryFn: getSchool,
    staleTime: 5 * 60 * 1000,
  });
