"use client";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/gate";
import * as actions from "@/lib/actions/gate";

// Bound first rather than inlined at `mutationFn`; see the note in lib/queries/fees.ts.
const createDevice = mutate(actions.createDevice);
const rotateDeviceKey = mutate(actions.rotateDeviceKey);
const deleteDevice = mutate(actions.deleteDevice);
const setDeviceUserId = mutate(actions.setDeviceUserId);
const updateGateSettings = mutate(actions.updateGateSettings);
const markNotificationsRead = mutate(actions.markNotificationsRead);

export const useGateSettings = () =>
  useQuery({ queryKey: queryKeys.gate.settings, queryFn: data.getGateSettings });

export const useDevices = () => useQuery({ queryKey: queryKeys.gate.devices, queryFn: data.listDevices });

export const useDevicePeople = () =>
  useQuery({ queryKey: queryKeys.gate.people, queryFn: data.listDevicePeople });

export const usePresence = (date: string) =>
  useQuery({ queryKey: queryKeys.gate.presence(date), queryFn: () => data.listPresence(date) });

function useGateMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["gate"] }) });
}

export const useCreateDevice = () => useGateMutation(createDevice);
export const useRotateDeviceKey = () => useGateMutation(rotateDeviceKey);
export const useDeleteDevice = () => useGateMutation(deleteDevice);
export const useSetDeviceUserId = () => useGateMutation(setDeviceUserId);
export const useUpdateGateSettings = () => useGateMutation(updateGateSettings);

// ---- Parent portal ----

export const useParentNotifications = () =>
  useQuery({ queryKey: queryKeys.parent.notifications, queryFn: () => data.listParentNotifications() });

export const useUnreadNotificationCount = () =>
  useQuery({ queryKey: queryKeys.parent.unreadNotifications, queryFn: data.countUnreadNotifications });

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parent.notifications }),
  });
}

/**
 * Refresh a guardian's notices the moment one is written. Realtime applies `pnotif_parent_read` to
 * each subscriber, so the filter is a narrowing, not the boundary. Any change also refreshes the
 * child's attendance, which the same scan has just marked.
 */
export function useLiveParentNotifications(parentId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!parentId) return;
    const client = createClient();
    const channel = client
      .channel(`parent-notifications-${parentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "parent_notifications",
          filter: `parent_profile_id=eq.${parentId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.parent.notifications });
          void qc.invalidateQueries({ queryKey: ["parent", "attendance"] });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [parentId, qc]);
}
