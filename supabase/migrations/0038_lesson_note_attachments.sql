-- 0038_lesson_note_attachments.sql
--
-- One optional document per lesson note. A path/name pair on the row rather than a join table,
-- same reasoning as terminal_reports.pdf_url: there is exactly one attachment per note, so a
-- second table would buy nothing but an extra join.
--
-- Object path convention: "<school_id>/<lesson_note_id>/<filename>" — the first two segments are
-- what the storage policies below check, matching the "<school_id>/<...>" prefix convention
-- established in migration 0012, extended one level for per-note ownership.

alter table public.lesson_notes
  add column attachment_path text,
  add column attachment_name text,
  add constraint lesson_notes_attachment_both_or_neither
    check ((attachment_path is null) = (attachment_name is null));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (
  'lesson-note-attachments',
  'lesson-note-attachments',
  false,
  10485760, -- 10 MiB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

-- Teacher: full access to attachments on notes they own, same ownership predicate as the table
-- itself (public.teacher_teaches, ln_teacher_* in 0037), regardless of draft/submitted status —
-- an attachment follows the same "editable any time" rule lesson note content already has.
create policy lesson_note_attachments_teacher_all on storage.objects for all to authenticated
  using (
    bucket_id = 'lesson-note-attachments'
    and (storage.foldername(name))[1] = public.current_school_id()::text
    and exists (
      select 1 from public.lesson_notes ln
      where ln.id = (storage.foldername(name))[2]::uuid
        and public.teacher_teaches(ln.class_id, ln.subject_id)
    )
  )
  with check (
    bucket_id = 'lesson-note-attachments'
    and (storage.foldername(name))[1] = public.current_school_id()::text
    and exists (
      select 1 from public.lesson_notes ln
      where ln.id = (storage.foldername(name))[2]::uuid
        and public.teacher_teaches(ln.class_id, ln.subject_id)
    )
  );

-- Admin: read-only, and only once the note itself is visible to them (ln_admin_select in 0037
-- requires status = 'submitted') — an attachment must not leak a draft's content through a side
-- door the note's own RLS already closes.
create policy lesson_note_attachments_admin_select on storage.objects for select to authenticated
  using (
    bucket_id = 'lesson-note-attachments'
    and public.is_school_admin()
    and (storage.foldername(name))[1] = public.current_school_id()::text
    and exists (
      select 1 from public.lesson_notes ln
      where ln.id = (storage.foldername(name))[2]::uuid
        and ln.school_id = public.current_school_id()
        and ln.status = 'submitted'
    )
  );
