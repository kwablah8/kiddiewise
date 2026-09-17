-- 0042_lesson_plan_template.sql
--
-- Reshapes lesson_notes to match the school's actual paper "Lesson Plan" form, photographed and
-- sent after 0037 shipped with a guessed shape (single content/homework fields, one per day). The
-- real form is weekly, not daily, and structured as Materials Needed + Learning Objectives
-- followed by three numbered Lesson/Assessment pairs — Lesson 1 through Lesson 3, each with its
-- own assessment field, not one lesson's worth of content for the whole week.
--
-- Renames rather than a new table: this is the same "one lesson plan per class-subject-period"
-- record the admin already reviews and a teacher already drafts, only its internal shape was
-- wrong, not what it represents.

alter table public.lesson_notes rename column date to week_ending;
alter table public.lesson_notes rename column resources to materials_needed;
alter table public.lesson_notes
  rename constraint lesson_notes_class_id_subject_id_date_key
  to lesson_notes_class_id_subject_id_week_ending_key;

alter table public.lesson_notes
  add column lesson1_content text,
  add column lesson1_assessment text,
  add column lesson2_content text,
  add column lesson2_assessment text,
  add column lesson3_content text,
  add column lesson3_assessment text;

-- `content` and `homework` aren't fields on the paper form. Fold anything already written into
-- Lesson 1's content instead of silently dropping it — a note drafted before this migration keeps
-- what a teacher typed rather than losing it the moment the shape changes underneath them.
update public.lesson_notes
set lesson1_content = nullif(trim(both E'\n' from
  coalesce(content, '') ||
  case when homework is not null and homework <> '' then E'\n\nHomework: ' || homework else '' end
), '')
where content is not null or homework is not null;

alter table public.lesson_notes
  drop column content,
  drop column homework;
