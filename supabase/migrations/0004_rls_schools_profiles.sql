-- 0004_rls_schools_profiles.sql
alter table public.schools enable row level security;
alter table public.profiles enable row level security;

-- schools: a user reads their own school; super_admin reads all.
create policy schools_select on public.schools for select to authenticated
  using (id = public.current_school_id() or public.is_super_admin());
-- super_admin manages schools (create/update/delete platform-wide).
create policy schools_super_all on public.schools for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
-- school_admin may update their own school's settings.
create policy schools_admin_update on public.schools for update to authenticated
  using (id = public.current_school_id() and public.is_school_admin())
  with check (id = public.current_school_id() and public.is_school_admin());

-- profiles: read self or same-school colleagues; super_admin reads all.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or school_id = public.current_school_id() or public.is_super_admin());
-- school_admin manages users within their school (provisioning also uses service role).
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_school_admin() and school_id = public.current_school_id())
  with check (public.is_school_admin() and school_id = public.current_school_id());
-- a user may update their own profile row (not role/school — enforced in app + provisioning).
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
