-- 0027_activity_log_self_read.sql, let everyone read their own activity rows.
--
-- 0010 gave every role self-insert (al_insert_self) but only admins a SELECT policy, so the
-- teacher dashboard's "recent activity" panel, which reads actor_id = the signed-in teacher,
-- silently returned nothing. Self-read closes that; the school-wide feed stays admin-only.

create policy al_self_read on public.activity_log for select to authenticated
  using (school_id = public.current_school_id() and actor_id = auth.uid());
