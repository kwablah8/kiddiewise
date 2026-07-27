"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/people";
import * as actions from "@/lib/actions/people";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic CALL in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it — it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const createStudent = mutate(actions.createStudent);
const updateStudent = mutate(actions.updateStudent);
const createParent = mutate(actions.createParent);
const linkGuardian = mutate(actions.linkGuardian);
const invitePortal = mutate(actions.invitePortal);
const reissueCredentials = mutate(actions.reissueCredentials);

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
    mutationFn: createStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.stats });
    },
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStudent,
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
    mutationFn: createParent,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.parents.all }),
  });
};

export const useLinkGuardian = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: linkGuardian,
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
export const useInvitePortal = () => useMutation({ mutationFn: invitePortal });

/**
 * Issue a fresh temporary password so the admin can send credentials again.
 *
 * Invalidates both people lists because the reissue resets `must_change_password`, and the portal
 * status column must flip back to "Awaiting first sign-in" — for staff and parents alike. The action
 * takes a bare `profile_id` and cannot tell which list the person is on, so both are refreshed rather
 * than guessed at.
 */
export const useReissueCredentials = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reissueCredentials,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.parents.all });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staffMember(variables.profile_id) });
    },
  });
};
