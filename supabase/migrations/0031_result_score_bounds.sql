-- 0031_result_score_bounds.sql
--
-- Enforce score sanity in the DATABASE, not just the Server Action.
--
-- results.score and assessments.max_score were both bare `numeric not null` with no bounds. The
-- score ceiling was checked only in lib/actions/result.ts — but RLS lets a teacher write results
-- directly through PostgREST (res_teacher_rw), so a crafted `POST /rest/v1/results` with
-- score = 99999 (or a negative) bypassed the action entirely. Every derived figure divides by
-- max_score, so one poisoned row corrupts that child's percentage AND the class average, high/low
-- and competition positions computed over the whole class — and freezes wrong into official reports.
--
-- Two cheap CHECKs cover the constant bounds; a trigger covers score <= max_score, which a CHECK
-- cannot express because it spans two tables. The trigger is SECURITY DEFINER with a pinned
-- search_path so it reads assessments regardless of the caller's rights, and only ever looks up one
-- row by primary key.
--
-- NOTE ON APPLYING: these constraints validate existing rows. If a school's data already contains a
-- negative score, a zero/negative max_score, or a score above its assessment's max, the ALTER will
-- fail loudly — that is a data-quality problem to fix first, not something to suppress.

alter table public.results
  add constraint results_score_nonneg check (score >= 0);

alter table public.assessments
  add constraint assessments_max_score_positive check (max_score > 0);

create or replace function public.enforce_result_score_ceiling()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max numeric;
begin
  select max_score into v_max from public.assessments where id = new.assessment_id;
  if v_max is null then
    raise exception 'Assessment % does not exist', new.assessment_id
      using errcode = 'foreign_key_violation';
  end if;
  if new.score > v_max then
    raise exception 'Score % exceeds this assessment''s maximum of %', new.score, v_max
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists results_score_ceiling on public.results;
create trigger results_score_ceiling
  before insert or update of score, assessment_id on public.results
  for each row execute function public.enforce_result_score_ceiling();
