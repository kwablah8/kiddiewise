import { PageHeader } from "@/components/app/page-header";
import { GradeScaleCard } from "@/components/grading/grade-scale-card";
import { AssessmentTypesCard } from "@/components/grading/assessment-types-card";

export default function GradingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading"
        subtitle="Define the grading scale and assessment types used across the school."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GradeScaleCard />
        <AssessmentTypesCard />
      </div>
    </div>
  );
}
