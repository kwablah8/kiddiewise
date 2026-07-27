"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/academics";
import * as actions from "@/lib/actions/academics";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic CALL in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it — it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const createYear = mutate(actions.createYear);
const createTerm = mutate(actions.createTerm);
const setActiveYear = mutate(actions.setActiveYear);
const setActiveTerm = mutate(actions.setActiveTerm);
const createClass = mutate(actions.createClass);
const updateClass = mutate(actions.updateClass);
const createSubject = mutate(actions.createSubject);
const updateSubject = mutate(actions.updateSubject);
const createStaff = mutate(actions.createStaff);
const updateStaff = mutate(actions.updateStaff);
const assignSubject = mutate(actions.assignSubject);
const unassign = mutate(actions.unassign);

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

// Staff detail's derived "subjects taught" panel — same class_subjects rows as
// `useAssignments`, filtered by teacher instead of class.
export const useAssignmentsForStaff = (staffId: string) =>
  useQuery({
    queryKey: queryKeys.academics.assignmentsByStaff(staffId),
    queryFn: () => data.listAssignmentsForStaff(staffId),
  });

// ---- mutations -----------------------------------------------------------

export const useCreateYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createYear,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.years }),
  });
};

export const useCreateTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTerm,
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
    mutationFn: setActiveYear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.years });
      qc.invalidateQueries({ queryKey: queryKeys.academics.activeContext });
    },
  });
};

export const useSetActiveTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setActiveTerm,
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
    mutationFn: createClass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.classes.options });
    },
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateClass,
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
    mutationFn: createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.subjects }),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.subjects }),
  });
};

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.academics.staff }),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStaff,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staffMember(variables.id) });
    },
  });
};

export const useAssignSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignSubject,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.academics.assignments(variables.class_id) });
      qc.invalidateQueries({ queryKey: queryKeys.academics.class(variables.class_id) });
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
      // Every open staff-detail assignments panel (assignmentsByStaff(*)) can be affected —
      // either the newly-assigned teacher's list gains a row, or (on a re-assign) the previous
      // teacher's list loses one — so invalidate the whole by-staff prefix rather than one id.
      qc.invalidateQueries({ queryKey: ["academics", "assignments", "by-staff"] });
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
    mutationFn: unassign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academics", "assignments"] });
      qc.invalidateQueries({ queryKey: queryKeys.academics.classes });
      qc.invalidateQueries({ queryKey: queryKeys.academics.staff });
    },
  });
};
