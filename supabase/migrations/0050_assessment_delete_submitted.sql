-- 0050_assessment_delete_submitted.sql
--
-- A teacher may delete an assessment only while none of its results has been submitted. Until now
-- that rule lived only in the server action, so anyone calling the API directly could remove an
-- assessment whose scores parents and report cards already read. The database now holds the line.
--
-- An admin is unchanged (asm_admin covers delete), and may remove a submitted assessment: its
-- results go with it through the results FK's on delete cascade.
--
-- A function rather than a subquery in the policy: a teacher's own read of results is narrowed by
-- RLS, so a subquery could miss a result submitted by someone else and wrongly allow the delete.

create function public.assessment_has_submitted_results(p_assessment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.results r
    where r.assessment_id = p_assessment_id and r.is_submitted
  )
$$;

revoke all on function public.assessment_has_submitted_results(uuid) from public, anon;
grant execute on function public.assessment_has_submitted_results(uuid) to authenticated;

drop policy asm_teacher_delete on public.assessments;

create policy asm_teacher_delete on public.assessments for delete to authenticated
  using (
    school_id = public.current_school_id()
    and public.teacher_teaches(class_id, subject_id)
    and not public.assessment_has_submitted_results(id)
  );
