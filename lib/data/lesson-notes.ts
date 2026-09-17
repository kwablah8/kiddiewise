import { db, unwrapList, unwrapMaybe } from "./_client";
import type {
  LessonNoteListItemVM,
  LessonNoteDetailVM,
  LessonNoteFilters,
} from "@/lib/validators/lesson-notes";

const SELECT = `
  id, class_id, subject_id, term_id, week_ending, topic, materials_needed, objectives,
  lesson1_content, lesson1_assessment, lesson2_content, lesson2_assessment,
  lesson3_content, lesson3_assessment,
  status, submitted_at, created_by, attachment_path, attachment_name,
  classes(name), subjects(name), terms(name),
  teacher:profiles!lesson_notes_created_by_fkey(first_name, last_name)
`;

interface LessonNoteRow {
  id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  week_ending: string;
  topic: string;
  materials_needed: string | null;
  objectives: string | null;
  lesson1_content: string | null;
  lesson1_assessment: string | null;
  lesson2_content: string | null;
  lesson2_assessment: string | null;
  lesson3_content: string | null;
  lesson3_assessment: string | null;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_by: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  terms: { name: string } | null;
  teacher: { first_name: string; last_name: string } | null;
}

function toListItemVM(n: LessonNoteRow): LessonNoteListItemVM {
  return {
    id: n.id,
    class_id: n.class_id,
    class_name: n.classes?.name ?? "",
    subject_id: n.subject_id,
    subject_name: n.subjects?.name ?? "",
    term_id: n.term_id,
    term_name: n.terms?.name ?? "",
    week_ending: n.week_ending,
    topic: n.topic,
    status: n.status,
    submitted_at: n.submitted_at,
    teacher_name: n.teacher ? `${n.teacher.first_name} ${n.teacher.last_name}` : "—",
    attachment_path: n.attachment_path,
    attachment_name: n.attachment_name,
  };
}

function toDetailVM(n: LessonNoteRow): LessonNoteDetailVM {
  return {
    ...toListItemVM(n),
    materials_needed: n.materials_needed,
    objectives: n.objectives,
    lesson1_content: n.lesson1_content,
    lesson1_assessment: n.lesson1_assessment,
    lesson2_content: n.lesson2_content,
    lesson2_assessment: n.lesson2_assessment,
    lesson3_content: n.lesson3_content,
    lesson3_assessment: n.lesson3_assessment,
  };
}

/**
 * The admin's browsing view. RLS (ln_admin_select) already confines this to `status = 'submitted'`
 * rows in the caller's own school, no status filter is applied here on purpose, a WHERE that
 * duplicated the policy would silently drift from it the next time one of the two changes.
 */
export async function listLessonNotes(
  filters: LessonNoteFilters = {},
): Promise<LessonNoteListItemVM[]> {
  let q = db().from("lesson_notes").select(SELECT).order("week_ending", { ascending: false });
  if (filters.term_id) q = q.eq("term_id", filters.term_id);
  if (filters.class_id) q = q.eq("class_id", filters.class_id);
  if (filters.subject_id) q = q.eq("subject_id", filters.subject_id);
  if (filters.teacher_id) q = q.eq("created_by", filters.teacher_id);

  return unwrapList(await q, "lesson notes").map(toListItemVM);
}

export async function getLessonNote(id: string): Promise<LessonNoteDetailVM | null> {
  const row = unwrapMaybe<LessonNoteRow>(
    await db().from("lesson_notes").select(SELECT).eq("id", id).single(),
    "lesson note",
  );
  return row ? toDetailVM(row) : null;
}

/**
 * The signed-in teacher's own notes, draft and submitted. Unlike `listTeacherAssessments`, no
 * client-side filtering by assignment is needed: ln_teacher_select already scopes every row to
 * `teacher_teaches(class_id, subject_id)`, so a caller with no matching assignment gets nothing
 * back regardless of what's in the table.
 */
export async function listMyLessonNotes(): Promise<LessonNoteListItemVM[]> {
  const rows = unwrapList(
    await db().from("lesson_notes").select(SELECT).order("week_ending", { ascending: false }),
    "lesson notes",
  );
  return rows.map(toListItemVM);
}
