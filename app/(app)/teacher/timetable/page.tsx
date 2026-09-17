"use client";

import { useSession } from "@/lib/auth/useSession";
import { PageHeader } from "@/components/app/page-header";
import { TeacherTimetable } from "@/components/teacher/teacher-timetable";

export default function TeacherTimetablePage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" subtitle="Your classes' weekly schedule." />
      <TeacherTimetable teacherId={profile.id} />
    </div>
  );
}
