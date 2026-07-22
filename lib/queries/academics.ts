"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/academics";
import * as actions from "@/lib/actions/academics";

// ---- reads -------------------------------------------------------------

export const useAcademicYears = () =>
  useQuery({ queryKey: queryKeys.academics.years, queryFn: data.listAcademicYears });

export const useTerms = (yearId?: string) =>
  useQuery({
    queryKey: queryKeys.academics.terms(yearId),
    queryFn: () => data.listTerms(yearId),
  });

export const useActiveContext = () =>
  useQuery({ queryKey: queryKeys.academics.activeContext, queryFn: data.getActiveContext });

export const useClasses = () =>
  useQuery({ queryKey: queryKeys.academics.classes, queryFn: data.listClasses });

export const useClass = (id: string) =>
  useQuery({ queryKey: queryKeys.academics.class(id), queryFn: () => data.getClass(id) });

export const useSubjects = () =>
  useQuery({ queryKey: queryKeys.academics.subjects, queryFn: data.listSubjects });

export const useStaff = () =>
  useQuery({ queryKey: queryKeys.academics.staff, queryFn: data.listStaff });

export const useStaffMember = (id: string) =>
  useQuery({ queryKey: queryKeys.academics.staffMember(id), queryFn: () => data.getStaff(id) });

export const useAssignments = (classId: string) =>
  useQuery({
    queryKey: queryKeys.academics.assignments(classId),
    queryFn: () => data.listAssignments(classId),
  });

// ---- mutations -----------------------------------------------------------

export const useCreateYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createYear,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.years }),
  });
};

export const useCreateTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createTerm,
    onSuccess: () => {
      // Invalidate the whole "academics","terms",* prefix (covers both the unfiltered list and
      // every per-year-filtered variant already cached) plus years, since term_count changed.
      qc.invalidateQueries({ queryKey: ["academics", "terms"] });
      qc.invalidateQueries({ queryKey: queryKeys.academics.years });
    },
  });
};

export const useSetActiveYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.setActiveYear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.years });
      qc.invalidateQueries({ queryKey: queryKeys.academics.activeContext });
    },
  });
};

export const useSetActiveTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.setActiveTerm,
    onSuccess: () => {
      // Every listTerms(yearId) entry (and the unfiltered listTerms()) can have its is_active
      // flag change, so invalidate the whole "academics","terms",* prefix rather than one id.
      qc.invalidateQueries({ queryKey: ["academics", "terms"] });
      qc.invalidateQueries({ queryKey: queryKeys.academics.activeContext });
    },
  });
};

export const useCreateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createClass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.classes.options });
    },
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.updateClass,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.academics.class(variables.id) });
      qc.invalidateQueries({ queryKey: queryKeys.classes.options });
      // Reassigning the class teacher changes that staff member's class_count.
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
    },
  });
};

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.subjects }),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.updateSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.subjects }),
  });
};

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createStaff,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.staff }),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.updateStaff,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staffMember(variables.id) });
    },
  });
};

export const useAssignSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.assignSubject,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.assignments(variables.class_id) });
      qc.invalidateQueries({ queryKey: queryKeys.academics.class(variables.class_id) });
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
      if (variables.teacher_id) {
        qc.invalidateQueries({ queryKey: queryKeys.academics.staffMember(variables.teacher_id) });
      }
    },
  });
};

// unassign only receives the class_subjects row id, not the class id it belonged to — so on
// success it invalidates the whole "academics","assignments",* prefix (every open assignments
// panel refetches) plus classes/staff, whose subject/class counts may have changed.
export const useUnassign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.unassign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academics", "assignments"] });
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
    },
  });
};
