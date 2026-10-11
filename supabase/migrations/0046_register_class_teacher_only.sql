-- 0046_register_class_teacher_only.sql
--
-- Only a class's class teacher may mark or amend its register. Until now any teacher who taught a
-- subject in the class could, so two teachers could overwrite each other's mark for the same child.
-- Admins are unchanged, and a class with no class teacher can only be marked by an admin.
--
-- Reading is untouched (att_teacher_select still uses teacher_teaches_class): terminal reports and
-- the teacher's class views read attendance for every class the teacher is assigned to.

create function public.teacher_is_class_teacher(p_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.class_teacher_id = auth.uid()
  )
$$;

revoke all on function public.teacher_is_class_teacher(uuid) from public, anon;
grant execute on function public.teacher_is_class_teacher(uuid) to authenticated;

drop policy att_teacher_insert on public.attendance;
drop policy att_teacher_update on public.attendance;

create policy att_teacher_insert on public.attendance for insert to authenticated
  with check (school_id = public.current_school_id() and public.teacher_is_class_teacher(class_id));
create policy att_teacher_update on public.attendance for update to authenticated
  using (school_id = public.current_school_id() and public.teacher_is_class_teacher(class_id))
  with check (school_id = public.current_school_id() and public.teacher_is_class_teacher(class_id));
