"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { TeacherAssessments } from "@/components/teacher/teacher-assessments";
import { AssessmentFormDialog } from "@/components/teacher/assessment-form";

export default function TeacherAssessmentPage() {
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
        title="Assessments"
        subtitle="Create assessments and review results for your classes."
        action={<Button onClick={openCreate}>New assessment</Button>}
      />
      <TeacherAssessments teacherId={profile.id} />
      <AssessmentFormDialog key={formKey} teacherId={profile.id} open={open} onOpenChange={setOpen} />
    </div>
  );
}
