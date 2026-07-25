"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { StaffTable } from "@/components/academics/staff-table";
import { StaffFormDialog } from "@/components/academics/staff-form";
import { CredentialsDialog } from "@/components/people/credentials-dialog";
import type { IssuedCredentials } from "@/lib/temp-password";

export default function StaffPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  // Held here, not inside the form: that dialog is remounted with a fresh `key` on every open and
  // closes the moment a create succeeds, so it cannot be what displays a password that exists exactly
  // once.
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  function openCreate() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Manage teaching staff, departments, and class/subject assignments."
        action={<Button onClick={openCreate}>New Staff</Button>}
      />
      <StaffTable onNewStaff={openCreate} />
      <StaffFormDialog
        key={createKey}
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setIssued}
      />
      <CredentialsDialog credentials={issued} onClose={() => setIssued(null)} />
    </div>
  );
}
