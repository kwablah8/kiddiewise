"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ClassesTable } from "@/components/academics/classes-table";
import { ClassFormDialog } from "@/components/academics/class-form";

export default function ClassesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);

  function openCreate() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        subtitle="Manage classes, levels, capacity, and class teachers."
        action={<Button onClick={openCreate}>New Class</Button>}
      />
      <ClassesTable onNewClass={openCreate} />
      <ClassFormDialog key={createKey} mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
