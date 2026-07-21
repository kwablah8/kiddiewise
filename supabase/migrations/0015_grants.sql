-- 0015_grants.sql
-- PostgREST authorizes a request in TWO layers: SQL table/column privileges for the request
-- role (anon/authenticated/service_role) AND Row Level Security. Migrations run as the
-- `postgres` role, whose default privileges grant these roles only TRUNCATE/REFERENCES/TRIGGER
-- on new public tables — NOT select/insert/update/delete. Without the grants below, requests
-- are denied at the privilege layer before RLS is ever evaluated: the app can read/write
-- nothing and the service-role test/seed paths fail too. RLS (enabled on every table) remains
-- the real row/tenant gate; these grants are the coarse layer beneath it.

grant usage on schema public to anon, authenticated, service_role;

-- service_role backs privileged server work (user provisioning, batch jobs, the RLS test
-- harness). It has BYPASSRLS but still needs table privileges.
grant all on all tables in schema public to service_role;

-- authenticated: DML on all app tables; RLS confines each caller to their own rows.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- anon: the only public write path is submitting an admissions inquiry (RLS: INSERT-only).
grant insert on public.admissions_inquiries to anon;

-- profiles.role / profiles.school_id must be immutable via the API. In Postgres a table-level
-- UPDATE grant CANNOT be narrowed by a column-level REVOKE (they are independent — the table
-- grant wins), so instead of granting table-level UPDATE we drop it for authenticated and
-- grant UPDATE only on the user-editable columns. Role/school changes go exclusively through
-- the service role (provisioning / controlled server actions).
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, email, phone, avatar_url, staff_no, department, is_active)
  on public.profiles to authenticated;
