"use client";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "./keys";
import { useSession } from "@/lib/auth/useSession";
import * as data from "@/lib/data/parent";

export function useParentChildren() {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.children,
    queryFn: () => data.getParentChildren(parentId),
    enabled: !!parentId,
  });
}

export function useParentAnnouncements() {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.announcements,
    queryFn: () => data.getParentAnnouncements(parentId),
    enabled: !!parentId,
  });
}

export function useChildProfile(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.child(childId),
    queryFn: () => data.getChildProfile(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}

export function useChildAttendance(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.attendance(childId),
    queryFn: () => data.getChildAttendance(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}

export function useChildTimetable(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.timetable(childId),
    queryFn: () => data.getChildTimetable(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}

export function useChildResults(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.results(childId),
    queryFn: () => data.getChildResults(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}

export function useChildReport(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.report(childId),
    queryFn: () => data.getChildReport(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}

export function useChildFees(childId: string) {
  const { profile } = useSession();
  const parentId = profile?.id ?? "";
  return useQuery({
    queryKey: queryKeys.parent.fees(childId),
    queryFn: () => data.getChildFees(parentId, childId),
    enabled: !!parentId && !!childId,
  });
}
