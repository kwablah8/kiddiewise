-- 0044_biometric_attendance.sql
--
-- Check-ins from a fingerprint device at the gate. A small program on the school's computer reads
-- each scan off the device and posts it to /api/attendance-device/scans, authenticated by a key
-- issued to that device. From the scans the app marks the student's register (present, or late
-- after the school's cut-off) and tells their guardians in the parent portal when the child arrived
-- and when they left.
--
-- What is stored, and what is derived:
--   * attendance_devices   who may post scans (the key is stored only as a hash).
--   * device_people        which student or staff member a device's user number belongs to.
--   * device_scans         every scan exactly as the device reported it. Who it was, and whether it
--                          was an arrival or a departure, is NOT stored here: it is resolved through
--                          device_people and the school's times, so linking a number after the fact
--                          or moving the cut-off re-reads history correctly.
--   * parent_notifications what a guardian was told. This one is stored, because it is an event
--                          that happened at a moment in time, not a fact to recompute.

-- ---------------------------------------------------------------------------
-- School settings for the gate.
-- ---------------------------------------------------------------------------
alter table public.schools
  -- The device reports wall-clock time with no zone; this is how it is read.
  add column timezone text not null default 'Africa/Accra',
  -- An arrival after this time is late.
  add column late_after time not null default '09:00',
  -- A scan at or after this time is a departure, not an arrival.
  add column leaving_from time not null default '12:00',
  add constraint schools_gate_times check (late_after < leaving_from);

-- ---------------------------------------------------------------------------
-- Devices allowed to post scans.
-- ---------------------------------------------------------------------------
create table public.attendance_devices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  name text not null,
  -- sha256 of the device's key, hex. The key itself is shown to the admin once and never stored.
  key_hash text not null unique,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);
create index attendance_devices_school_id_idx on public.attendance_devices(school_id);

alter table public.attendance_devices enable row level security;
create policy adev_admin on public.attendance_devices for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
grant select, insert, update, delete on public.attendance_devices to authenticated;
grant all on public.attendance_devices to service_role;

-- ---------------------------------------------------------------------------
-- Device user number -> student or staff member.
-- ---------------------------------------------------------------------------
create table public.device_people (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  -- The number enrolled on the device ("1005"). Text: some ZKTeco firmware allows letters.
  device_user_id text not null check (device_user_id ~ '^[A-Za-z0-9]{1,24}$'),
  student_id uuid unique references public.students(id) on delete cascade,
  staff_id uuid unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Exactly one person per number; one number per person.
  constraint device_people_one_person check ((student_id is null) <> (staff_id is null)),
  unique (school_id, device_user_id)
);
create index device_people_school_id_idx on public.device_people(school_id);

alter table public.device_people enable row level security;
create policy dpeople_admin on public.device_people for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
grant select, insert, update, delete on public.device_people to authenticated;
grant all on public.device_people to service_role;

-- ---------------------------------------------------------------------------
-- Raw scans. Written only by the ingest route, through the service role.
-- ---------------------------------------------------------------------------
create table public.device_scans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  device_id uuid not null references public.attendance_devices(id) on delete restrict,
  device_user_id text not null,
  scanned_at timestamptz not null,
  -- The school day the scan belongs to, in the school's timezone at the time it was received.
  local_date date not null,
  created_at timestamptz not null default now(),
  -- The program re-sends after an outage; the same scan must land once.
  unique (device_id, device_user_id, scanned_at)
);
create index device_scans_school_date_idx on public.device_scans(school_id, local_date);
create index device_scans_user_date_idx on public.device_scans(school_id, device_user_id, local_date);

alter table public.device_scans enable row level security;
create policy dscans_admin_read on public.device_scans for select to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id());
grant select on public.device_scans to authenticated;
grant all on public.device_scans to service_role;

-- ---------------------------------------------------------------------------
-- One row per person per school day: when they arrived and when they left.
--
-- Arrival is the first scan before the school's leaving time, departure the first scan at or after
-- it. Who the person is comes from device_people as it is now, so a number linked today also
-- resolves last week's scans. security_invoker, so device_scans' admin-only policy applies.
-- ---------------------------------------------------------------------------
create view public.daily_presence with (security_invoker = true) as
select
  sc.school_id,
  sc.local_date,
  sc.device_user_id,
  dp.student_id,
  dp.staff_id,
  min(sc.scanned_at) filter (
    where (sc.scanned_at at time zone s.timezone)::time < s.leaving_from
  ) as arrived_at,
  min(sc.scanned_at) filter (
    where (sc.scanned_at at time zone s.timezone)::time >= s.leaving_from
  ) as left_at,
  coalesce(
    (min(sc.scanned_at) filter (
      where (sc.scanned_at at time zone s.timezone)::time < s.leaving_from
    ) at time zone s.timezone)::time > s.late_after,
    false
  ) as late
from public.device_scans sc
join public.schools s on s.id = sc.school_id
left join public.device_people dp
  on dp.school_id = sc.school_id and dp.device_user_id = sc.device_user_id
group by sc.school_id, sc.local_date, sc.device_user_id, dp.student_id, dp.staff_id, s.timezone,
  s.leaving_from, s.late_after;

grant select on public.daily_presence to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- What each guardian has been told.
-- ---------------------------------------------------------------------------
create type gate_event as enum ('arrived', 'left');

create table public.parent_notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  event gate_event not null,
  occurred_at timestamptz not null,
  local_date date not null,
  -- Whether the arrival was after the cut-off, as judged when the guardian was told.
  late boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  -- One arrival and one departure per child per day, however many times they scan.
  unique (parent_profile_id, student_id, event, local_date)
);
create index parent_notifications_parent_idx
  on public.parent_notifications(parent_profile_id, occurred_at desc);

alter table public.parent_notifications enable row level security;
create policy pnotif_parent_read on public.parent_notifications for select to authenticated
  using (school_id = public.current_school_id() and parent_profile_id = auth.uid());
create policy pnotif_parent_mark_read on public.parent_notifications for update to authenticated
  using (school_id = public.current_school_id() and parent_profile_id = auth.uid())
  with check (school_id = public.current_school_id() and parent_profile_id = auth.uid());
-- A guardian may only mark a notification read; everything else is written by the ingest route.
grant select on public.parent_notifications to authenticated;
grant update (read_at) on public.parent_notifications to authenticated;
grant all on public.parent_notifications to service_role;

-- Live updates in the parent portal. Realtime evaluates the select policy above per subscriber.
alter publication supabase_realtime add table public.parent_notifications;
