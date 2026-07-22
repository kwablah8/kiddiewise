"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { SubjectsTable } from "@/components/academics/subjects-table";
import { SubjectFormDialog } from "@/components/academics/subject-form";

export default function SubjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);

  function openCreate() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        subtitle="Manage the subjects taught across classes."
        action={<Button onClick={openCreate}>New Subject</Button>}
      />
      <SubjectsTable onNewSubject={openCreate} />
      <SubjectFormDialog key={createKey} mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
