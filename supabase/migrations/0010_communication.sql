-- 0010_communication.sql
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  title text not null,
  body text not null,
  audience announcement_audience not null default 'everyone',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index announcements_school_id_idx on public.announcements(school_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_school_id_idx on public.events(school_id);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_school_id_idx on public.activity_log(school_id, created_at desc);

create table public.admissions_inquiries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  applicant_name text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  desired_class text,
  message text,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index admissions_inquiries_school_id_idx on public.admissions_inquiries(school_id);

alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.activity_log enable row level security;
alter table public.admissions_inquiries enable row level security;

-- announcements: admin full; audience-targeted, published reads for teacher/parent.
create policy ann_admin on public.announcements for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
create policy ann_read on public.announcements for select to authenticated
  using (
    school_id = public.current_school_id() and is_published and (
      audience = 'everyone'
      or (audience = 'teachers' and public.current_role() = 'teacher')
      or (audience = 'parents' and public.current_role() = 'parent')
      or public.is_school_admin()
    )
  );

-- events: same-school read, admin write.
create policy ev_select on public.events for select to authenticated
  using (school_id = public.current_school_id());
create policy ev_admin on public.events for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

-- activity_log: admins read; any authenticated user may append their own actions in-school.
create policy al_admin_read on public.activity_log for select to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id());
create policy al_insert_self on public.activity_log for insert to authenticated
  with check (school_id = public.current_school_id() and actor_id = auth.uid());

-- admissions_inquiries: the ONLY anonymous write. INSERT-only for anon; admins read/manage.
create policy inq_anon_insert on public.admissions_inquiries for insert to anon
  with check (true);
create policy inq_admin_all on public.admissions_inquiries for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
