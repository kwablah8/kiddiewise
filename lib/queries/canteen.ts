"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/canteen";
import {
  saveCanteenMenu as saveCanteenMenuAction,
  publishCanteenMenu as publishCanteenMenuAction,
  unpublishCanteenMenu as unpublishCanteenMenuAction,
} from "@/lib/actions/canteen";

const saveCanteenMenu = mutate(saveCanteenMenuAction);
// Explicit generics: publish/unpublish take no input, and TypeScript can't infer TInput from a
// zero-argument source function against mutate()'s `(input: TInput) => ...` target type.
const publishCanteenMenu = mutate<void, { ok: true }>(publishCanteenMenuAction);
const unpublishCanteenMenu = mutate<void, { ok: true }>(unpublishCanteenMenuAction);

/** Admin's full view — draft and published. */
export const useCanteenMenu = () =>
  useQuery({ queryKey: queryKeys.canteen.menu, queryFn: data.getCanteenMenu });

/** Parent's view — RLS confines this to published rows. */
export const usePublishedCanteenMenu = () =>
  useQuery({ queryKey: queryKeys.canteen.publishedMenu, queryFn: data.getPublishedCanteenMenu });

export function useSaveCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveCanteenMenu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["canteen"] }),
  });
}

export function usePublishCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishCanteenMenu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["canteen"] }),
  });
}

export function useUnpublishCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unpublishCanteenMenu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["canteen"] }),
  });
}
