"use client";

import { useSession } from "@/lib/auth/useSession";
import { PageHeader } from "@/components/app/page-header";
import { TerminalReports } from "@/components/reports/terminal-reports";

export default function TeacherTerminalReportsPage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Terminal Reports"
        subtitle="Compile, remark and publish your class's report cards for the term."
      />
      <TerminalReports teacherId={profile.id} />
    </div>
  );
}
