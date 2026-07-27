-- 0022_subject_status.sql
-- Active / inactive status for subjects.
--
-- Schools stop teaching a subject without wanting it erased: the marks, the class assignments and
-- the terminal reports that reference it all have to keep resolving. Deleting is not an option
-- (subjects.id is referenced by class_subjects, and through it by results), and neither is leaving
-- a dropped subject in every picker forever. A status column is the honest middle: the history
-- stays intact and the subject stops being offered.
--
-- `not null default true` so every existing subject stays exactly as it is. No backfill needed, and
-- no window where a subject reads as neither active nor inactive.
alter table public.subjects
  add column is_active boolean not null default true;

comment on column public.subjects.is_active is
  'False when the school no longer teaches this subject. Kept rather than deleted so existing marks and class assignments still resolve — see 0022.';

-- Indexed because every picker and the subjects list filter on it, and the column is low-cardinality
-- only in the sense that most rows are true — which is exactly the case a partial index serves well.
create index subjects_active_idx on public.subjects(school_id, is_active);
