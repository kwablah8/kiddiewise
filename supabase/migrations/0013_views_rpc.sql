-- 0013_views_rpc.sql — dashboard aggregates (docs/03-DATABASE.md §12)
-- All functions run with the caller's rights (security invoker) so RLS still applies.

create or replace function public.dashboard_stats()
returns table(total_students bigint, total_staff bigint, total_revenue numeric,
              attendance_rate numeric)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from students s where s.school_id = current_school_id()
       and s.enrollment_status = 'active'),
    (select count(*) from profiles p where p.school_id = current_school_id()
       and p.role = 'teacher' and p.is_active),
    (select coalesce(sum(pm.amount),0) from payments pm
       where pm.school_id = current_school_id()),
    (select case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status in ('present','late')) / count(*), 0)
      end from attendance a where a.school_id = current_school_id())
$$;

create or replace function public.enrollment_trend()
returns table(month date, count bigint)
language sql stable security invoker set search_path = public as $$
  select date_trunc('month', enrolled_at)::date as month, count(*)
  from enrollments where school_id = current_school_id()
  group by 1 order by 1
$$;

create or replace function public.fee_collection_trend()
returns table(month date, total numeric)
language sql stable security invoker set search_path = public as $$
  select date_trunc('month', paid_at)::date as month, sum(amount)
  from payments where school_id = current_school_id()
  group by 1 order by 1
$$;

create or replace function public.class_performance()
returns table(class_id uuid, class_name text, level text, students bigint, average_score numeric)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name, c.level,
    (select count(*) from enrollments e where e.class_id = c.id and e.status = 'active'),
    (select round(avg(r.score),1) from results r
       join assessments a on a.id = r.assessment_id
       where a.class_id = c.id and r.is_submitted)
  from classes c where c.school_id = current_school_id()
  order by c.name
$$;

create or replace function public.student_attendance_summary(p_student_id uuid, p_term_id uuid)
returns table(present int, total int, percentage numeric)
language sql stable security invoker set search_path = public as $$
  select
    count(*) filter (where status in ('present','late'))::int,
    count(*)::int,
    case when count(*) = 0 then 0
      else round(100.0 * count(*) filter (where status in ('present','late')) / count(*), 0)
    end
  from attendance
  where student_id = p_student_id and term_id = p_term_id
$$;
