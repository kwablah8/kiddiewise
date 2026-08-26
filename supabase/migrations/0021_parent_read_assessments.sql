-- 0021_parent_read_assessments.sql
-- Parents could read their children's `results` but not the `assessments` those results belong to.
--
-- 0008 gave `assessments` an admin policy and two teacher policies and stopped there. That looks
-- harmless until you read a result: a score is meaningless without the assessment, because the
-- assessment holds the subject and the `max_score` a mark is out of. The parent portal therefore joins
-- `results → assessments` with an INNER join, and an inner join against a table the caller cannot read
-- returns NOTHING. The result: the parent's results page showed "No results published yet" no matter
-- how many marks teachers submitted, and the dashboard's "latest result" was permanently blank.
--
-- Nothing about this was visible in the RLS suite, which asserted the two tables separately and passed
-- on both. The bug lived exactly in the join between them.
--
-- Scope: assessments belonging to a class one of their children is enrolled in. That is broader than
-- "assessments my child has a result for", and deliberately so, a parent should see that a test
-- happened even before it is marked. It leaks nothing about other students: an assessment row is a
-- class-level artefact (title, subject, date, max score) and contains no per-student data. Other
-- students' RESULTS remain gated by `res_parent_read`.

create policy asm_parent_read on public.assessments for select to authenticated
  using (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.enrollments e
      where e.class_id = assessments.class_id
        and public.parent_of_student(e.student_id)
    )
  );
