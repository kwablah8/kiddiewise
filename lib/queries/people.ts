"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/people";
import * as actions from "@/lib/actions/people";

export const useStudents = (params: { search?: string } = {}) =>
  useQuery({
    queryKey: [...queryKeys.students.all, params],
    queryFn: () => data.listStudents(params),
  });

export const useStudent = (id: string) =>
  useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => data.getStudent(id),
  });

export const useParents = () =>
  useQuery({ queryKey: queryKeys.parents.all, queryFn: data.listParents });

export const useClassOptions = () =>
  useQuery({ queryKey: queryKeys.classes.options, queryFn: data.listClassOptions });

export const useCreateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.students.all }),
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.updateStudent,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(variables.id) });
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
      qc.invalidateQueries({ queryKey: queryKeys.parents.all });
    },
  });
};
