-- 0016_students_profiles_catchup.sql
-- Closes the drift between the built Admin UI and the schema. The student intake form
-- (app/(app)/students/new) and the student drawer already collect bio, contact, medical and
-- previous-school details that `students` had nowhere to store; the guardian view-model
-- (lib/validators/people.ts#guardianVM) already reads an occupation off the parent profile.
-- Column names match the Zod field names 1:1 so lib/data/people.ts maps without renaming.

create type blood_group as enum ('A+','A-','B+','B-','AB+','AB-','O+','O-');

alter table public.students
  add column other_names        text,
  add column blood_group        blood_group,
  add column enrollment_date    date,
  add column medical_conditions text,
  add column allergies          text,
  -- Previous school block. prev_average_score is text, not numeric: the form accepts free-form
  -- entries ("72%", "B+", "N/A") because prior-school reporting is not standardised.
  add column prev_school_name   text,
  add column prev_class_ended   text,
  add column prev_average_score text,
  add column prev_year_attended text,
  -- Student's own contact details (older students) or the household's.
  add column email              text,
  add column phone              text,
  add column address            text,
  add column city               text,
  add column town               text,
  -- The year/term the student was first admitted into, captured at intake. Distinct from the
  -- active enrollment (see `enrollments`), which changes as the student is promoted.
  add column initial_academic_year_id uuid references public.academic_years(id) on delete set null,
  add column initial_term_id          uuid references public.terms(id) on delete set null;

-- Guardians may have an occupation recorded (shown on the student drawer's guardian card).
alter table public.profiles add column occupation text;

-- 0015 withheld table-level UPDATE on profiles and granted it per column instead (so role and
-- school_id stay immutable via the API). Column grants are additive, so a new user-editable
-- column must be granted explicitly or it is silently read-only.
grant update (occupation) on public.profiles to authenticated;

-- Single-primary invariant: a student has at most one primary guardian. The mock store enforced
-- this by demoting existing primaries on link (lib/mock/store.ts#linkGuardian); the real path
-- enforces it here so a concurrent write can't create two.
create unique index student_guardians_one_primary
  on public.student_guardians(student_id) where is_primary;
