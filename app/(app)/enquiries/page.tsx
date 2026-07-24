import { PageHeader } from "@/components/app/page-header";
import { InquiriesTable } from "@/components/admissions/inquiries-table";

export default function AdmissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        subtitle="Review inquiries from your website and convert accepted applicants into students."
      />
      <InquiriesTable />
    </div>
  );
}
