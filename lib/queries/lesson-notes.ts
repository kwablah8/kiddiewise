"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/lesson-notes";
import {
  createLessonNote as createLessonNoteAction,
  updateLessonNote as updateLessonNoteAction,
  submitLessonNote as submitLessonNoteAction,
  deleteLessonNote as deleteLessonNoteAction,
  setLessonNoteAttachment as setLessonNoteAttachmentAction,
} from "@/lib/actions/lesson-notes";
import type { LessonNoteFilters } from "@/lib/validators/lesson-notes";

const createLessonNote = mutate(createLessonNoteAction);
const updateLessonNote = mutate(updateLessonNoteAction);
const submitLessonNote = mutate(submitLessonNoteAction);
const deleteLessonNote = mutate(deleteLessonNoteAction);
const setLessonNoteAttachment = mutate(setLessonNoteAttachmentAction);

/** Admin's browsing view — filtered, submitted-only (RLS, not this hook, enforces that). */
export const useLessonNotes = (filters: LessonNoteFilters = {}) =>
  useQuery({
    queryKey: queryKeys.lessonNotes.list(filters),
    queryFn: () => data.listLessonNotes(filters),
  });

export const useLessonNote = (id: string) =>
  useQuery({
    queryKey: queryKeys.lessonNotes.detail(id),
    queryFn: () => data.getLessonNote(id),
  });

/** The signed-in teacher's own notes, draft and submitted. */
export const useMyLessonNotes = () =>
  useQuery({
    queryKey: queryKeys.lessonNotes.mine,
    queryFn: () => data.listMyLessonNotes(),
  });

export function useCreateLessonNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLessonNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-notes"] }),
  });
}

export function useUpdateLessonNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLessonNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-notes"] }),
  });
}

export function useSubmitLessonNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitLessonNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-notes"] }),
  });
}

export function useDeleteLessonNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLessonNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-notes"] }),
  });
}

/** Records where a direct-to-storage upload landed (lib/storage/lesson-notes.ts does the upload itself). */
export function useSetLessonNoteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setLessonNoteAttachment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-notes"] }),
  });
}
