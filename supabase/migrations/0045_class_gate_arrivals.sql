-- 0045_class_gate_arrivals.sql
--
-- The time each student in a class scanned in at the gate on a day, for the teacher's register.
--
-- Scans are admin-only (dscans_admin_read, 0044): the raw log names every number on the device and
-- every staff member's comings and goings, none of which a teacher needs. A teacher needs one thing
-- from it, the arrival time of the students on their own register, so this function returns exactly
-- that and nothing else, after the same check the register's own policies use
-- (teacher_teaches_class) or for an admin.
--
-- Security definer so it can read past dscans_admin_read; it therefore scopes to the caller's school
-- itself. Arrival is read from daily_presence, so the rule for "arrived" has one definition.

create function public.class_gate_arrivals(p_class_id uuid, p_date date)
returns table (student_id uuid, arrived_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.student_id, p.arrived_at
  from public.daily_presence p
  join public.schools s on s.id = p.school_id
  -- Students on this class's roll in the active year, the roster the register shows.
  join public.enrollments e
    on e.student_id = p.student_id
   and e.class_id = p_class_id
   and e.academic_year_id = s.active_academic_year_id
  where p.school_id = public.current_school_id()
    and p.local_date = p_date
    and p.arrived_at is not null
    and (public.is_school_admin() or public.teacher_teaches_class(p_class_id))
$$;

revoke all on function public.class_gate_arrivals(uuid, date) from public, anon;
grant execute on function public.class_gate_arrivals(uuid, date) to authenticated, service_role;
