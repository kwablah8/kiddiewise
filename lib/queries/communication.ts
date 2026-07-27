"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";

import { queryKeys } from "./keys";
import * as data from "@/lib/data/communication";
import * as actions from "@/lib/actions/communication";

// Bound to consts so useMutation can infer its variables type — see the note in
// lib/queries/people.ts. Do not inline these into `mutationFn`.
const createAnnouncement = mutate(actions.createAnnouncement);
const updateAnnouncement = mutate(actions.updateAnnouncement);
const deleteAnnouncement = mutate(actions.deleteAnnouncement);
const createEvent = mutate(actions.createEvent);
const updateEvent = mutate(actions.updateEvent);
const deleteEvent = mutate(actions.deleteEvent);

export const useAnnouncements = () =>
  useQuery({ queryKey: queryKeys.communication.announcements, queryFn: data.listAnnouncements });

export const useEvents = () =>
  useQuery({ queryKey: queryKeys.communication.events, queryFn: data.listEvents });

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: queryKeys.communication.upcomingEvents,
    queryFn: () => data.listUpcomingEvents(),
  });

/**
 * Every announcement write invalidates the PARENT tree as well as the admin list.
 *
 * Publishing is the whole point of the feature: the moment it lands, a parent's dashboard must stop
 * showing the old set. The parent panel reads through its own query key, so invalidating only the
 * admin list would leave the portal that matters serving a stale cache.
 */
function useAnnouncementMutation<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communication"] });
      qc.invalidateQueries({ queryKey: ["parent"] });
    },
  });
}

export const useCreateAnnouncement = () => useAnnouncementMutation(createAnnouncement);
export const useUpdateAnnouncement = () => useAnnouncementMutation(updateAnnouncement);
export const useDeleteAnnouncement = () => useAnnouncementMutation(deleteAnnouncement);
export const useCreateEvent = () => useAnnouncementMutation(createEvent);
export const useUpdateEvent = () => useAnnouncementMutation(updateEvent);
export const useDeleteEvent = () => useAnnouncementMutation(deleteEvent);
