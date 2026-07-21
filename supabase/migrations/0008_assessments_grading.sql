-- 0008_assessments_grading.sql
create table public.assessment_types (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  weight numeric not null default 0,        -- percent toward term total
  unique (school_id, name)
);
create index assessment_types_school_id_idx on public.assessment_types(school_id);

create table public.grade_bands (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  min_score numeric not null,
  max_score numeric not null,
  grade text not null,                      -- "A1"
  remark text not null,                     -- "Excellent"
  check (min_score <= max_score)
);
create index grade_bands_school_id_idx on public.grade_bands(school_id);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete restrict,
  assessment_type_id uuid not null references public.assessment_types(id) on delete restrict,
  title text not null,
  max_score numeric not null,
  date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index assessments_school_id_idx on public.assessments(school_id);
create index assessments_class_subject_idx on public.assessments(class_id, subject_id);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric not null,
  grade text,
  remark text,
  entered_by uuid references public.profiles(id) on delete set null,
  is_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);
create index results_school_id_idx on public.results(school_id);
create index results_student_idx on public.results(student_id);

alter table public.assessment_types enable row level security;
alter table public.grade_bands enable row level security;
alter table public.assessments enable row level security;
alter table public.results enable row level security;

-- grading config: same-school read, admin write
create policy at_select on public.assessment_types for select to authenticated
  using (school_id = public.current_school_id());
create policy at_admin on public.assessment_types for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy gb_select on public.grade_bands for select to authenticated
  using (school_id = public.current_school_id());
create policy gb_admin on public.grade_bands for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

-- assessments: admin full; teacher writes only for subjects they teach; teacher/parent read
create policy asm_admin on public.assessments for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy asm_teacher_select on public.assessments for select to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
create policy asm_teacher_insert on public.assessments for insert to authenticated
  with check (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
create policy asm_teacher_update on public.assessments for update to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id))
  with check (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));

-- results: admin full; teacher writes results for their own assessments; parent reads
-- SUBMITTED results for linked children.
create policy res_admin on public.results for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy res_teacher_rw on public.results for all to authenticated
  using (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.assessments a
      where a.id = results.assessment_id and public.teacher_teaches(a.class_id, a.subject_id)
    )
  )
  with check (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.assessments a
      where a.id = results.assessment_id and public.teacher_teaches(a.class_id, a.subject_id)
    )
  );
create policy res_parent_read on public.results for select to authenticated
  using (
    school_id = public.current_school_id() and is_submitted
    and public.parent_of_student(student_id)
  );
