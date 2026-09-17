-- 0039_canteen_menu.sql
--
-- A weekly, recurring canteen menu: one row per school day (Monday-Friday), edited in place rather
-- than a growing list of dated entries — the school's "what we serve on Mondays" answer changes
-- occasionally, it does not accumulate history the way attendance or lesson notes do.
--
-- is_published mirrors announcements.is_published: an admin can rewrite a day's item without it
-- disappearing from the parent's view (the row simply keeps showing whatever was last published),
-- and unlike lesson_notes this one IS reversible, an admin can unpublish a day that fell through
-- without deleting it, there is no equivalent "the admin already saw it" reason to forbid that here.

create type weekday as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

create table public.canteen_menu_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  day_of_week weekday not null,
  description text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, day_of_week)
);
create index canteen_menu_items_school_id_idx on public.canteen_menu_items(school_id);

alter table public.canteen_menu_items enable row level security;

create policy cmi_admin on public.canteen_menu_items for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());

-- Parent only, not "any authenticated same-school user": a teacher asking for canteen visibility
-- is a real but separate request, RLS defaults to deny, so this is exactly the boundary until asked.
create policy cmi_parent_select on public.canteen_menu_items for select to authenticated
  using (
    school_id = public.current_school_id()
    and public.current_role() = 'parent'
    and is_published
  );

grant select, insert, update, delete on public.canteen_menu_items to authenticated;
grant all on public.canteen_menu_items to service_role;
