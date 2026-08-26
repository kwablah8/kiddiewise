-- 0026_daily_reports.sql, the pupil's daily report (SNAB "Child's Daily Report" form).
--
-- One report per student per day, filled from both sides: the parent's morning section (sleep,
-- breakfast, medication, pickup) and the teacher's day section (toileting, nap, activities,
-- meals, mood, homework). two tables rather than one wide row, deliberately: RLS is the security
-- boundary and Postgres cannot scope column writes per caller within one row, so a single table
-- would let a hostile parent client overwrite the teacher's section via PostgREST.
-- Split, each side's write policies own their table outright, and a day's report is the join of
-- the two on (student_id, date).

create type daily_sleep as enum ('good','ok','not_well');
create type daily_child_mood as enum ('happy','funny','other');
create type daily_portion as enum ('all','some','none');
create type daily_lesson_mood as enum ('attentive','fidgeting','unwell');
create type daily_play_mood as enum ('mingled','did_not_mingle','unwell');

-- ---------------------------------------------------------------------------
-- Parent's report about the child (filled before/at drop-off)
-- ---------------------------------------------------------------------------
create table public.daily_reports_parent (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,

  slept daily_sleep,
  seems daily_child_mood,
  comments text,                       -- section-1 comments (sleep/mood context)
  ate_before_school boolean,
  feeding_time text, food text, portion text,
  had_medication boolean,
  medication_details text,             -- names, amounts and times given
  medication_reason text,
  special_requests text,
  pickup_info text,                    -- what time the child is picked and by who
  parent_comments text,                -- closing "comments from parent"

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date)
);
create index daily_reports_parent_school_idx on public.daily_reports_parent(school_id);
create index daily_reports_parent_student_date_idx on public.daily_reports_parent(student_id, date);

-- ---------------------------------------------------------------------------
-- Teacher's report about the child (filled through/at the end of the day)
-- ---------------------------------------------------------------------------
create table public.daily_reports_teacher (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,

  -- Variable-length diapering/toileting log: [{ "time": "", "wet": bool, "dry": bool,
  -- "description": "" }, ...]. A child sub-table would buy nothing, entries are only ever read
  -- and written as part of their day's report.
  toileting jsonb not null default '[]'::jsonb,
  nap_start text, nap_wake text,
  activities text[] not null default '{}',   -- fixed vocabulary enforced by the Zod contract
  breakfast daily_portion, lunch daily_portion, snack daily_portion,
  medication_given text,               -- name, amount, time and staff initial
  mood_lessons daily_lesson_mood,
  mood_play daily_play_mood,
  teacher_comments text,               -- comments / special request from teacher (homework)

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date)
);
create index daily_reports_teacher_school_idx on public.daily_reports_teacher(school_id);
create index daily_reports_teacher_student_date_idx on public.daily_reports_teacher(student_id, date);

alter table public.daily_reports_parent enable row level security;
alter table public.daily_reports_teacher enable row level security;

-- Parent side: parents write their own children's rows; the child's teachers read them.
create policy drp_admin on public.daily_reports_parent for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy drp_parent_select on public.daily_reports_parent for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));
create policy drp_parent_insert on public.daily_reports_parent for insert to authenticated
  with check (school_id = public.current_school_id() and public.parent_of_student(student_id));
create policy drp_parent_update on public.daily_reports_parent for update to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id))
  with check (school_id = public.current_school_id() and public.parent_of_student(student_id));
create policy drp_teacher_select on public.daily_reports_parent for select to authenticated
  using (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_parent.student_id
      and public.teacher_teaches_class(e.class_id)));

-- Teacher side: the child's teachers write; the child's parents read.
create policy drt_admin on public.daily_reports_teacher for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy drt_teacher_select on public.daily_reports_teacher for select to authenticated
  using (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_teaches_class(e.class_id)));
create policy drt_teacher_insert on public.daily_reports_teacher for insert to authenticated
  with check (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_teaches_class(e.class_id)));
create policy drt_teacher_update on public.daily_reports_teacher for update to authenticated
  using (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_teaches_class(e.class_id)))
  with check (school_id = public.current_school_id() and exists (
    select 1 from public.enrollments e
    where e.student_id = daily_reports_teacher.student_id
      and public.teacher_teaches_class(e.class_id)));
create policy drt_parent_select on public.daily_reports_teacher for select to authenticated
  using (school_id = public.current_school_id() and public.parent_of_student(student_id));

-- Table privileges: 0015's blanket grants predate these tables (docs/09 §gotchas).
grant select, insert, update, delete on public.daily_reports_parent to authenticated;
grant select, insert, update, delete on public.daily_reports_teacher to authenticated;
grant all on public.daily_reports_parent to service_role;
grant all on public.daily_reports_teacher to service_role;
