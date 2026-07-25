"use client";

import { useSession } from "@/lib/auth/useSession";
import { PageHeader } from "@/components/app/page-header";
import { ScoreEntry } from "@/components/teacher/score-entry";

export default function TeacherGradePage() {
  const { profile } = useSession();
  if (!profile) return null; // the (app) guard guarantees a profile

  return (
    <div className="space-y-6">
      <PageHeader title="Grade" subtitle="Enter and submit results for your class subjects." />
      <ScoreEntry teacherId={profile.id} />
    </div>
  );
}
