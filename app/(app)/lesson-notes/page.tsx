import { PageHeader } from "@/components/app/page-header";
import { LessonNotesTable } from "@/components/lesson-notes/lesson-notes-table";

export default function LessonNotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson Notes"
        subtitle="Lesson notes teachers have submitted, across classes and subjects."
      />
      <LessonNotesTable />
    </div>
  );
}
