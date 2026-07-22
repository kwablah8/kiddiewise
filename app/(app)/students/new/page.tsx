import { PageHeader } from "@/components/app/page-header";
import { StudentForm } from "@/components/students/student-form";

export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Student"
        subtitle="Add a student record, assign a class, and link guardians."
      />
      <StudentForm mode="create" />
    </div>
  );
}
