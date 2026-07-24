"use client";

import { useSession } from "@/lib/auth/useSession";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceMarker } from "@/components/teacher/attendance-marker";

export default function TeacherAttendancePage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Mark and edit daily attendance for your classes." />
      <AttendanceMarker teacherId={profile.id} />
    </div>
  );
}
