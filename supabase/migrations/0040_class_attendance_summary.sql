-- 0040_class_attendance_summary.sql
--
-- Per-class attendance, the same shape and reasoning as class_performance() (migration 0013): two
-- subqueries rather than one grouped join, matching that function's own idiom rather than optimizing
-- a table this small (docs/09-DEV-RUNBOOK.md §7 — ~720 attendance rows for the whole demo school).
-- Unscoped by term/year on purpose, same as dashboard_stats()'s own attendance_rate field, callers
-- that want a narrower window filter client-side.

create or replace function public.class_attendance_summary()
returns table(class_id uuid, class_name text, level text, present_count bigint, total_count bigint)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name, c.level,
    (select count(*) from attendance a where a.class_id = c.id and a.status in ('present','late')),
    (select count(*) from attendance a where a.class_id = c.id)
  from classes c where c.school_id = current_school_id()
  order by c.name
$$;
