"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { LessonNotesTable } from "@/components/teacher/lesson-notes-table";
import { LessonNoteFormDialog } from "@/components/teacher/lesson-note-form-dialog";

export default function TeacherLessonNotesPage() {
  const { profile } = useSession();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  if (!profile) return null; // the (app) guard guarantees a profile

  function openCreate() {
    setFormKey((k) => k + 1); // remount the dialog so it resets to defaults
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson Notes"
        subtitle="Write lesson notes for your classes and submit them to the admin."
        action={<Button onClick={openCreate}>New lesson note</Button>}
      />
      <LessonNotesTable />
      <LessonNoteFormDialog key={formKey} teacherId={profile.id} open={open} onOpenChange={setOpen} />
    </div>
  );
}
