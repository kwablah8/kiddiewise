-- 0006_academic_structure.sql
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,                       -- "2026/2027"
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create index academic_years_school_id_idx on public.academic_years(school_id);
create unique index academic_years_one_active
  on public.academic_years(school_id) where is_active;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,                       -- "First Term"
  ordinal int not null check (ordinal between 1 and 3),
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create index terms_school_id_idx on public.terms(school_id);
create unique index terms_one_active on public.terms(school_id) where is_active;

-- now safe to add the circular FKs onto schools
alter table public.schools
  add constraint schools_active_year_fk
    foreign key (active_academic_year_id) references public.academic_years(id) on delete set null,
  add constraint schools_active_term_fk
    foreign key (active_term_id) references public.terms(id) on delete set null;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,                       -- "Basic 1"
  level text not null,                      -- "Primary"
  capacity int,
  class_teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index classes_school_id_idx on public.classes(school_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  code text,
  unique (school_id, name)
);
create index subjects_school_id_idx on public.subjects(school_id);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  unique (class_id, subject_id)
);
create index class_subjects_school_id_idx on public.class_subjects(school_id);
create index class_subjects_teacher_idx on public.class_subjects(teacher_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  status enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (student_id, academic_year_id)
);
create index enrollments_school_id_idx on public.enrollments(school_id);
create index enrollments_class_idx on public.enrollments(class_id);

-- RLS: config/academic tables are readable by anyone in the school; only admins write.
-- enrollments additionally readable by assigned teachers and linked parents.
alter table public.academic_years enable row level security;
alter table public.terms enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.enrollments enable row level security;

-- reusable pattern applied per table: same-school SELECT, admin all with WITH CHECK.
create policy ay_select on public.academic_years for select to authenticated
  using (school_id = public.current_school_id());
create policy ay_admin on public.academic_years for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

create policy terms_select on public.terms for select to authenticated
  using (school_id = public.current_school_id());
create policy terms_admin on public.terms for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

create policy classes_select on public.classes for select to authenticated
  using (school_id = public.current_school_id());
create policy classes_admin on public.classes for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

create policy subjects_select on public.subjects for select to authenticated
  using (school_id = public.current_school_id());
create policy subjects_admin on public.subjects for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

create policy cs_select on public.class_subjects for select to authenticated
  using (school_id = public.current_school_id());
create policy cs_admin on public.class_subjects for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

-- enrollments: admin full; teacher reads assigned classes; parent reads linked children.
create policy enr_admin on public.enrollments for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy enr_teacher_read on public.enrollments for select to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches_class(class_id));
create policy enr_parent_read on public.enrollments for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));

-- Deferred from 0005_students_guardians.sql: this policy's USING clause queries
-- public.enrollments directly, so it can only be created now that enrollments exists.
-- Policy text is verbatim from the plan's Task B5 SQL.
create policy students_teacher_read on public.students for select to authenticated
  using (
    school_id = public.current_school_id() and public.current_role() = 'teacher'
    and exists (
      select 1 from public.enrollments e
      where e.student_id = students.id and public.teacher_teaches_class(e.class_id)
    )
  );
