-- 0033_reports_bucket_staff_only.sql
--
-- Restrict the private 'reports' storage bucket to STAFF, matching its documented intent.
--
-- 0012 commented reports_school_read as "same-school staff read (parents get short-lived signed URLs
-- from the server)", but the policy predicate checks only bucket + same-school folder, with no role
-- gate. So any same-school authenticated user, including a parent, could list and download every
-- child's report-card object in the bucket, not just their own child's. (The bucket is unused today;
-- this closes the hole before report PDFs are ever written into it.)
--
-- Parents still reach their own child's report through a service-role-signed URL minted by the
-- server after an ownership check, the path that already exists, not through direct bucket access.

drop policy if exists reports_school_read on storage.objects;

create policy reports_school_read on storage.objects for select to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_school_id()::text
    and public.current_role() in ('school_admin', 'teacher')
  );
