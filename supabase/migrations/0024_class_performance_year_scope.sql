-- 0024_class_performance_year_scope.sql, scope the dashboard's per-class student count to the
-- active academic year. Promotion appends one enrollment per year and never rewrites history
-- (docs/05-USER-FLOWS.md §7), so the unscoped count kept counting promoted-out students against
-- their old class forever. Mirrors the year scoping applied across lib/data reads.

create or replace function public.class_performance()
returns table(class_id uuid, class_name text, level text, students bigint, average_score numeric)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name, c.level,
    (select count(*) from enrollments e
       where e.class_id = c.id and e.status = 'active'
         and e.academic_year_id in (select y.id from academic_years y
              where y.school_id = current_school_id() and y.is_active)),
    (select round(avg(r.score),1) from results r
       join assessments a on a.id = r.assessment_id
       where a.class_id = c.id and r.is_submitted)
  from classes c where c.school_id = current_school_id()
  order by c.name
$$;
