"use client";

import { useSession } from "@/lib/auth/useSession";
import { PageHeader } from "@/components/app/page-header";
import { TeacherDailyReport } from "@/components/teacher/daily-report";

export default function TeacherDailyReportPage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Report"
        subtitle="Each child's day: the parent's morning report and your report back to them."
      />
      <TeacherDailyReport teacherId={profile.id} />
    </div>
  );
}
