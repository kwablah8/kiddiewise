-- 0012_storage.sql, buckets + policies (docs/02-ARCHITECTURE.md §7)
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', false),
  ('school-logos','school-logos', true),
  ('gallery','gallery', true),
  ('reports','reports', false)
on conflict (id) do nothing;

-- Convention: object path is prefixed with the school id: "<school_id>/<...>".
-- avatars: same-school read; admins write.
create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_school_id()::text);
create policy avatars_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text)
  with check (bucket_id = 'avatars' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text);

-- school-logos & gallery: public read; school_admin writes within their prefix.
create policy logos_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'school-logos' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text)
  with check (bucket_id = 'school-logos' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text);
create policy gallery_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'gallery' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text)
  with check (bucket_id = 'gallery' and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text);

-- reports: same-school staff read (parents get short-lived signed URLs from the server);
-- writes are service-role only (bypasses RLS), so no authenticated write policy.
create policy reports_school_read on storage.objects for select to authenticated
  using (bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_school_id()::text);
