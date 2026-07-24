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
