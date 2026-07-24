"use client";

import { useSession } from "@/lib/auth/useSession";
import { GreetingHeader } from "@/components/teacher/greeting-header";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";

export default function TeacherDashboardPage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile; this narrows the type

  return (
    <div className="space-y-6">
      <GreetingHeader profile={profile} />
      <TeacherDashboard teacherId={profile.id} />
    </div>
  );
}
