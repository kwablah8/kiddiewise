import { PageHeader } from "@/components/app/page-header";
import { AssessmentsTable } from "@/components/assessments/assessments-table";

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        subtitle="Monitor assessments and results across classes and subjects."
      />
      <AssessmentsTable />
    </div>
  );
}
