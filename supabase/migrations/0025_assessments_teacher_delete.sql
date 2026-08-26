-- 0025_assessments_teacher_delete.sql, teachers may delete assessments for the class-subject
-- pairs they teach. 0008 gave them insert/update but no delete, so removing a mistyped assessment
-- needed an admin. Same ownership predicate as asm_teacher_insert/update; the app-level guard in
-- lib/actions/assessments.ts blocks deletion once submitted results exist (block-if-history).
-- Draft results go with the assessment via
-- the results FK's on delete cascade.

create policy asm_teacher_delete on public.assessments for delete to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
