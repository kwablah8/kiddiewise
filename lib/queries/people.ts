"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/people";
import * as actions from "@/lib/actions/people";

export const useStudents = (
  params: { search?: string; status?: string; gender?: string; class_id?: string } = {},
) =>
  useQuery({
    queryKey: [...queryKeys.students.all, params],
    queryFn: () => data.listStudents(params),
  });

export const useStudent = (id: string) =>
  useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => data.getStudent(id),
  });

export const useStudentStats = () =>
  useQuery({ queryKey: queryKeys.students.stats, queryFn: data.getStudentStats });

export const useStudentAcademics = (id: string) =>
  useQuery({
    queryKey: queryKeys.students.academics(id),
    queryFn: () => data.getStudentAcademics(id),
  });

export const useParents = () =>
  useQuery({ queryKey: queryKeys.parents.all, queryFn: data.listParents });

export const useClassOptions = () =>
  useQuery({ queryKey: queryKeys.classes.options, queryFn: data.listClassOptions });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.stats });
    },
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.updateStudent,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(variables.id) });
      qc.invalidateQueries({ queryKey: queryKeys.students.stats });
    },
  });
};

export const useCreateParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createParent,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parents.all }),
  });
};

export const useLinkGuardian = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.linkGuardian,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(variables.student_id) });
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.stats });
      qc.invalidateQueries({ queryKey: queryKeys.parents.all });
    },
  });
};

/**
 * Grant portal access to a parent or staff member. Returns either a copyable link (delivery: "link")
 * or confirmation that an email went out (delivery: "email").
 *
 * No cache invalidation: inviting doesn't change any row the UI renders — the account already existed,
 * silently, from the moment the person was added.
 */
export const useInvitePortal = () => useMutation({ mutationFn: actions.invitePortal });
