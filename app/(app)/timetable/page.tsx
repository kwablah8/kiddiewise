import { PageHeader } from "@/components/app/page-header";
import { PeriodsCard } from "@/components/timetable/periods-card";
import { ClassTimetableEditor } from "@/components/timetable/class-timetable-editor";

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Set up the school's periods, then build each class's weekly schedule."
      />
      <PeriodsCard />
      <ClassTimetableEditor />
    </div>
  );
}
