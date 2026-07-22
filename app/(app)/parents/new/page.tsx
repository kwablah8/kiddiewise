import { PageHeader } from "@/components/app/page-header";
import { ParentForm } from "@/components/parents/parent-form";

export default function NewParentPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Parent" subtitle="Add a parent record to link to students." />
      <ParentForm />
    </div>
  );
}
