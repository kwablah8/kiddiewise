-- 0007_attendance.sql
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  date date not null,
  status attendance_status not null,
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date)
);
create index attendance_school_id_idx on public.attendance(school_id);
create index attendance_class_date_idx on public.attendance(class_id, date);

alter table public.attendance enable row level security;

create policy att_admin on public.attendance for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
-- teacher may read + write attendance only for classes they teach
create policy att_teacher_select on public.attendance for select to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches_class(class_id));
create policy att_teacher_insert on public.attendance for insert to authenticated
  with check (school_id = public.current_school_id() and public.teacher_teaches_class(class_id));
create policy att_teacher_update on public.attendance for update to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches_class(class_id))
  with check (school_id = public.current_school_id() and public.teacher_teaches_class(class_id));
-- parent reads attendance for their linked children
create policy att_parent_read on public.attendance for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));
