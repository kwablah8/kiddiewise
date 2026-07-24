import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { scoreToGrade } from "@/lib/grading";
import type {
  AssessmentListItemVM,
  AssessmentDetailVM,
  AssessmentResultVM,
  AssessmentFilters,
} from "@/lib/validators/assessments";

type AssessmentRecord = (typeof store)["assessments"][number];

function toListItemVM(a: AssessmentRecord): AssessmentListItemVM {
  const cls = store.classes.find((c) => c.id === a.class_id);
  const subject = store.subjects.find((s) => s.id === a.subject_id);
  const term = store.terms.find((t) => t.id === a.term_id);
  const type = store.assessmentTypes.find((t) => t.id === a.assessment_type_id);
  return {
    id: a.id,
    title: a.title,
    class_id: a.class_id,
    class_name: cls?.name ?? "",
    subject_id: a.subject_id,
    subject_name: subject?.name ?? "",
    term_id: a.term_id,
    term_name: term?.name ?? "",
    type_name: type?.name ?? "",
    max_score: a.max_score,
    date: a.date,
    result_count: store.results.filter((r) => r.assessment_id === a.id).length,
    is_submitted: a.is_submitted,
  };
}

export function listAssessments(filters: AssessmentFilters = {}): Promise<AssessmentListItemVM[]> {
  const result = store.assessments
    .filter((a) => (filters.term_id ? a.term_id === filters.term_id : true))
    .filter((a) => (filters.class_id ? a.class_id === filters.class_id : true))
    .filter((a) => (filters.subject_id ? a.subject_id === filters.subject_id : true))
    .map(toListItemVM);
  return simulate(result, []);
}

export function getAssessment(id: string): Promise<AssessmentDetailVM | null> {
  const found = store.assessments.find((a) => a.id === id);
  if (!found) return simulate(null, null);
  const base = toListItemVM(found);
  // Grades derived from the CURRENT grading scale (SEAM: real reads use the stored results.grade).
  const results: AssessmentResultVM[] = store.results
    .filter((r) => r.assessment_id === id)
    .map((r) => {
      const student = store.students.find((s) => s.id === r.student_id);
      const derived = scoreToGrade(r.score, found.max_score, store.gradeBands);
      return {
        student_id: r.student_id,
        student_name: student ? `${student.first_name} ${student.last_name}` : "—",
        admission_no: student?.admission_no ?? "—",
        score: r.score,
        grade: derived?.grade ?? null,
        remark: derived?.remark ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);
  return simulate({ ...base, results }, null);
}
