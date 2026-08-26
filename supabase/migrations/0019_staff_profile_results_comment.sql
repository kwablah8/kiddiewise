-- 0019_staff_profile_results_comment.sql
-- The last of the UI/schema drift (see 0016 and 0017 for the rest).
--
-- 1. The staff create/edit form and the staff detail page (lib/validators/academics.ts#staffVM)
--    collect an employment record that `profiles` had nowhere to store.
-- 2. The parent portal's results view shows the subject teacher's note per subject
--    (lib/validators/parent.ts#subjectResultVM.teacher_comment). `results.remark` is not that,
--    it is the grading scale's remark for the band ("Very Good"), written by the grading logic.
--    Conflating the two would let a teacher's note be overwritten every time a score is regraded.

alter table public.profiles
  -- Free-text job title ("Head Teacher", "Accountant"). Distinct from `role`, which is the auth
  -- role and only ever teacher/school_admin, a bursar and a head teacher share a role but not a job.
  add column position       text,
  add column gender         gender,
  add column date_of_birth  date,
  add column hire_date       date,
  add column qualification  text;

-- 0015 withheld table-level UPDATE on profiles and granted it column by column so that `role` and
-- `school_id` cannot be changed through the API. New editable columns must be added explicitly.
grant update (position, gender, date_of_birth, hire_date, qualification)
  on public.profiles to authenticated;

alter table public.results add column teacher_comment text;
