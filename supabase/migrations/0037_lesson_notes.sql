-- 0037_lesson_notes.sql
--
-- A teacher's lesson note for one class-subject-day, submitted to the admin for visibility.
-- Two states rather than one: 'draft' is private to the authoring teacher, so they can write and
-- revise before anyone else sees it; 'submitted' is what "seen by the admin" means. There is no
-- unsubmit — ln_admin_select only reveals submitted rows, so retracting one would need to account
-- for an admin who already opened it, which this table doesn't attempt. Editing after submission
-- is still allowed (the row simply keeps showing its current content), only deleting is not.

create type lesson_note_status as enum ('draft', 'submitted');

create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  date date not null,
  topic text not null,
  objectives text,
  content text,
  homework text,
  resources text,
  status lesson_note_status not null default 'draft',
  submitted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id, date)
);
create index lesson_notes_school_id_idx on public.lesson_notes(school_id);
create index lesson_notes_class_subject_idx on public.lesson_notes(class_id, subject_id);

alter table public.lesson_notes enable row level security;

-- Admin: read-only, and only what has actually been submitted. Drafts stay the teacher's own until
-- they choose to send them, matching daily_reports' split-by-author reasoning even though this is
-- one table, not two: the gate here is a status column instead of a second row.
create policy ln_admin_select on public.lesson_notes for select to authenticated
  using (
    public.is_school_admin() and school_id = public.current_school_id() and status = 'submitted'
  );

-- Teacher: the assigned class-subject teacher (public.teacher_teaches, same helper assessments and
-- results use) reads, writes and edits their own notes regardless of status. Delete is narrower,
-- only while still a draft, so a note the admin has already seen can't disappear out from under
-- them; the app-level guard in lib/actions/lesson-notes.ts checks the same rule first to give a
-- readable message rather than a silent no-op.
create policy ln_teacher_select on public.lesson_notes for select to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
create policy ln_teacher_insert on public.lesson_notes for insert to authenticated
  with check (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
create policy ln_teacher_update on public.lesson_notes for update to authenticated
  using (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id))
  with check (school_id = public.current_school_id() and public.teacher_teaches(class_id, subject_id));
create policy ln_teacher_delete on public.lesson_notes for delete to authenticated
  using (
    school_id = public.current_school_id()
    and public.teacher_teaches(class_id, subject_id)
    and status = 'draft'
  );

-- Post-0015 table: grants are not inherited from the blanket grant that migration ran, see the
-- runbook's gotcha list.
grant select, insert, update, delete on public.lesson_notes to authenticated;
grant all on public.lesson_notes to service_role;
