-- 0049_sidebar_counts_non_teaching.sql
--
-- The staff count beside "Staff" in the sidebar is the Staff screen's head count, which now includes
-- non-teaching staff (0048).

create or replace function public.sidebar_counts()
returns table(students bigint, staff bigint, new_inquiries bigint)
language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from students s
       where s.school_id = current_school_id() and s.enrollment_status = 'active'),
    (select count(*) from profiles p
       where p.school_id = current_school_id() and p.is_active
         and p.role in ('teacher','school_admin','non_teaching')),
    (select count(*) from admissions_inquiries q
       where q.school_id = current_school_id() and q.status = 'new')
$$;
