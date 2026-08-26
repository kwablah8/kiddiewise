-- 0005_students_guardians.sql
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  admission_no text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender gender not null,
  photo_url text,
  enrollment_status enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index students_school_id_idx on public.students(school_id);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship guardian_relationship not null,
  is_primary boolean not null default false,
  unique (student_id, parent_profile_id)
);
create index student_guardians_school_id_idx on public.student_guardians(school_id);
create index student_guardians_parent_idx on public.student_guardians(parent_profile_id);

alter table public.students enable row level security;
alter table public.student_guardians enable row level security;

-- students: admin full within school; teacher reads students in classes they teach;
-- parent reads their linked children.
create policy students_admin_all on public.students for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
-- NOTE: students_teacher_read is deferred to 0006_academic_structure.sql. Its USING clause
-- queries public.enrollments directly (not through a SECURITY DEFINER function), and unlike
-- function bodies, CREATE POLICY expressions are resolved at creation time, enrollments
-- doesn't exist until 0006. Same deferral pattern as schools_active_year_fk/active_term_fk
-- below in 0006. Policy text is verbatim from the plan, only its migration location moved.
create policy students_parent_read on public.students for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(id));

-- student_guardians: admin full; parent reads their own links.
create policy guardians_admin_all on public.student_guardians for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy guardians_parent_read on public.student_guardians for select to authenticated
  using (parent_profile_id = auth.uid());
