-- 0009_terminal_reports.sql
create table public.terminal_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  total_score numeric,
  average_score numeric,
  position int,
  attendance_present int not null default 0,
  attendance_total int not null default 0,
  class_teacher_comment text,
  head_teacher_comment text,
  pdf_url text,
  is_published boolean not null default false,
  generated_at timestamptz not null default now(),
  unique (student_id, term_id)
);
create index terminal_reports_school_id_idx on public.terminal_reports(school_id);

alter table public.terminal_reports enable row level security;

create policy tr_admin on public.terminal_reports for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy tr_teacher_read on public.terminal_reports for select to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches_class(class_id));
create policy tr_parent_read on public.terminal_reports for select to authenticated
  using (
    school_id = public.current_school_id() and is_published
    and public.parent_of_student(student_id)
  );
