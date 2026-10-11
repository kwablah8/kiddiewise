-- 0047_daily_report_class_teacher_only.sql
--
-- Only the class teacher of a child's class may write the teacher's section of the daily report,
-- the same rule as the register (0046). The section is one row per child per day that is upserted
-- whole, so a second teacher saving it replaced the first one's toileting, meals and medication
-- notes. Admins are unchanged, and a class with no class teacher is written by an admin.
--
-- Reading is untouched: drt_teacher_select still lets any teacher of the class read it.

drop policy drt_teacher_insert on public.daily_reports_teacher;
drop policy drt_teacher_update on public.daily_reports_teacher;

create policy drt_teacher_insert on public.daily_reports_teacher for insert to authenticated
  with check (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_is_class_teacher(e.class_id)));
create policy drt_teacher_update on public.daily_reports_teacher for update to authenticated
  using (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_is_class_teacher(e.class_id)))
  with check (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_is_class_teacher(e.class_id)));
