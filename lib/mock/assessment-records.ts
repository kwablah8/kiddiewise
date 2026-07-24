// Raw assessment/result record shapes (mirror the 0008 tables minus school_id/created_by/created_at).
// is_submitted is modeled per-assessment in the mock (SEAM: the real column lives per result on `results`).
export interface AssessmentRecord {
  id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  assessment_type_id: string;
  title: string;
  max_score: number;
  date: string | null;
  is_submitted: boolean;
}
export interface ResultRecord {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number;
}
