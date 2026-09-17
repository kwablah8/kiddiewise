-- 0041_timetable.sql
--
-- Two tables: `periods` is the school's shared time-slot structure (Period 1, Break, Period 2...),
-- defined once and reused by every class's timetable, the same "define once, reuse everywhere"
-- shape as assessment_types/grade_bands. `timetable_entries` is one class's grid: a subject per
-- (class, weekday, period). `weekday` already exists (migration 0039, canteen_menu_items) and is
-- reused as-is rather than redefined.
--
-- No teacher column on an entry: the teacher for a (class, subject) pair is already
-- class_subjects.teacher_id, unique per pair. Storing it again here would be the same fact twice,
-- free to drift the moment a class's subject assignment changes without this row being touched.
-- Readers join class_subjects to show it.
--
-- RLS mirrors classes/subjects/class_subjects exactly (migration 0006): admin writes, any
-- authenticated same-school user reads. A class's schedule isn't sensitive student data, it's
-- structural information like "who teaches what", which those three tables already treat as
-- broadly readable within the tenant.

create table public.periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  start_time time not null,
  end_time time not null,
  ordinal int not null,
  -- A break/lunch row: shown in the grid but never assignable to a subject, so it reads as
  -- "nothing goes here" rather than "not filled in yet".
  is_break boolean not null default false,
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  unique (school_id, ordinal)
);
create index periods_school_id_idx on public.periods(school_id);

alter table public.periods enable row level security;

create policy periods_select on public.periods for select to authenticated
  using (school_id = public.current_school_id());
create policy periods_admin on public.periods for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

grant select, insert, update, delete on public.periods to authenticated;
grant all on public.periods to service_role;

create table public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete cascade,
  day_of_week weekday not null,
  period_id uuid not null references public.periods(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One subject per class-day-period slot. An empty cell is simply the absence of a row, not a
  -- nullable subject_id, same "no row = not set" choice canteen_menu_items makes per day.
  unique (class_id, day_of_week, period_id)
);
create index timetable_entries_school_id_idx on public.timetable_entries(school_id);
create index timetable_entries_class_idx on public.timetable_entries(class_id);

alter table public.timetable_entries enable row level security;

create policy tte_select on public.timetable_entries for select to authenticated
  using (school_id = public.current_school_id());
create policy tte_admin on public.timetable_entries for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

grant select, insert, update, delete on public.timetable_entries to authenticated;
grant all on public.timetable_entries to service_role;
