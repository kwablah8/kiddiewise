-- 0030_profiles_select_parent_scope.sql
--
-- Stop parents from reading the whole school's people directory.
--
-- The original profiles_select (0004) let ANY authenticated same-school user read every profile row:
--
--   using (id = auth.uid() or school_id = public.current_school_id() or public.is_super_admin())
--
-- For staff that is intended, an admin or teacher legitimately sees colleagues and the families they
-- serve. For a PARENT it is a privacy leak: signed in with nothing but their own session, a parent
-- could `GET /rest/v1/profiles?select=*` and download every other parent's and every staff member's
-- name, email, phone and date of birth across a school of thousands.
--
-- Narrow it by role. Parents keep exactly what the portal actually reads through RLS embeds, their
-- own row, plus school STAFF (the class/subject teachers whose names appear on a child's report card
-- and daily report, and the office to contact). They can no longer enumerate other parents at all.
-- Staff and super_admin are unchanged. Verified against lib/data/parent.ts: the only profile reads a
-- parent performs are teacher-name embeds (classes.class_teacher, class_subjects.teacher), both staff.

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles for select to authenticated
  using (
    -- always your own row
    id = auth.uid()
    -- platform owner sees everything
    or public.is_super_admin()
    -- staff see the full same-school directory (colleagues + the families they serve)
    or (
      school_id = public.current_school_id()
      and public.current_role() in ('school_admin', 'teacher')
    )
    -- a parent sees only their school's STAFF, never other parents' contact details
    or (
      school_id = public.current_school_id()
      and public.current_role() = 'parent'
      and role in ('school_admin', 'teacher')
    )
  );
