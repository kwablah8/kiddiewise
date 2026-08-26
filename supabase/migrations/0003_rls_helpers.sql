-- 0003_rls_helpers.sql, SECURITY DEFINER helpers backing every policy (docs/03-DATABASE §10)
-- Some helpers below reference tables created in LATER migrations (class_subjects, classes,
-- student_guardians). LANGUAGE sql bodies are validated at CREATE time, so disable that check
-- for this migration; the tables exist before any policy actually calls these functions.
set check_function_bodies = off;

create or replace function public.current_school_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_school_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'school_admin' from public.profiles where id = auth.uid()), false)
$$;

-- Teacher is assigned to a class as subject teacher OR homeroom (class) teacher.
create or replace function public.teacher_teaches_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_subjects cs
    where cs.class_id = p_class_id and cs.teacher_id = auth.uid()
  ) or exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.class_teacher_id = auth.uid()
  )
$$;

-- Teacher teaches a specific subject in a class (for assessments/results).
create or replace function public.teacher_teaches(p_class_id uuid, p_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_subjects cs
    where cs.class_id = p_class_id and cs.subject_id = p_subject_id
      and cs.teacher_id = auth.uid()
  )
$$;

-- Parent is a linked guardian of the student.
create or replace function public.parent_of_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.student_guardians sg
    where sg.student_id = p_student_id and sg.parent_profile_id = auth.uid()
  )
$$;
