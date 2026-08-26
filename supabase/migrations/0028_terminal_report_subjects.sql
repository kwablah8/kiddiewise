-- 0028_terminal_report_subjects.sql, the GES report card's data.
--
-- Three additions: the scoring flags that split a subject into Class Score / Exams Score
-- (is_exam on assessment types, the school's CA weight), the per-student report-card fields the
-- class teacher fills (conduct, attitude, interest, promoted-to), and a per-subject SNAPSHOT
-- table, a generated report is a record, so its subject rows are frozen at generation rather
-- than re-derived, exactly like the aggregate figures on terminal_reports.

alter table public.assessment_types
  add column is_exam boolean not null default false;
-- The GES split: everything that isn't the end-of-term examination is continuous assessment.
update public.assessment_types set is_exam = true where name ilike '%end%term%exam%';

-- Exam weight is always (100 - ca_weight): one stored fact, never two that can disagree.
alter table public.schools
  add column ca_weight int not null default 50 check (ca_weight between 1 and 99);

alter table public.terminal_reports
  add column conduct text,
  add column attitude text,
  add column interest text,
  add column promoted_to text,
  -- "Number on roll" printed on the card, the class size when the report was generated.
  add column enrolled_count int;

create table public.terminal_report_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  report_id uuid not null references public.terminal_reports(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  -- Snapshot by NAME: renaming a subject later must not rewrite what a report card said.
  subject_name text not null,
  class_score numeric,
  exam_score numeric,
  total numeric,
  position int,
  remark text,
  unique (report_id, subject_name)
);
create index terminal_report_subjects_school_idx on public.terminal_report_subjects(school_id);
create index terminal_report_subjects_report_idx on public.terminal_report_subjects(report_id);

alter table public.terminal_report_subjects enable row level security;

-- The class teacher compiles their own class's reports (spec decision 1), insert/update on the
-- report rows, full row control on the subject snapshot (regeneration replaces it wholesale).
-- Publishing is just an update to is_published, so decision 2 (teachers publish) needs no extra
-- policy. Deleting a report stays admin-only.
create policy tr_class_teacher_write on public.terminal_reports for insert to authenticated
  with check (
    school_id = public.current_school_id() and exists (
      select 1 from public.classes c
      where c.id = terminal_reports.class_id and c.class_teacher_id = auth.uid()));
create policy tr_class_teacher_update on public.terminal_reports for update to authenticated
  using (
    school_id = public.current_school_id() and exists (
      select 1 from public.classes c
      where c.id = terminal_reports.class_id and c.class_teacher_id = auth.uid()))
  with check (
    school_id = public.current_school_id() and exists (
      select 1 from public.classes c
      where c.id = terminal_reports.class_id and c.class_teacher_id = auth.uid()));

create policy trs_admin on public.terminal_report_subjects for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy trs_class_teacher_all on public.terminal_report_subjects for all to authenticated
  using (
    school_id = public.current_school_id() and exists (
      select 1 from public.terminal_reports tr
      join public.classes c on c.id = tr.class_id
      where tr.id = terminal_report_subjects.report_id and c.class_teacher_id = auth.uid()))
  with check (
    school_id = public.current_school_id() and exists (
      select 1 from public.terminal_reports tr
      join public.classes c on c.id = tr.class_id
      where tr.id = terminal_report_subjects.report_id and c.class_teacher_id = auth.uid()));
-- Any teacher of the class may READ (mirrors tr_teacher_read's shape: the report's class is one
-- they teach).
create policy trs_teacher_read on public.terminal_report_subjects for select to authenticated
  using (
    school_id = public.current_school_id() and exists (
      select 1 from public.terminal_reports tr
      where tr.id = terminal_report_subjects.report_id
        and public.teacher_teaches_class(tr.class_id)));
-- Parents read their child's rows only once the report is PUBLISHED, same gate as the report row.
create policy trs_parent_read on public.terminal_report_subjects for select to authenticated
  using (
    school_id = public.current_school_id()
    and public.parent_of_student(student_id)
    and exists (
      select 1 from public.terminal_reports tr
      where tr.id = terminal_report_subjects.report_id and tr.is_published));

-- Table privileges: 0015's blanket grants predate this table (docs/09 §gotchas).
grant select, insert, update, delete on public.terminal_report_subjects to authenticated;
grant all on public.terminal_report_subjects to service_role;
