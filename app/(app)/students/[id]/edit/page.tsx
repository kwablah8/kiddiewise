import { PageHeader } from "@/components/app/page-header";
import { StudentForm } from "@/components/students/student-form";

interface EditStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student"
        subtitle="Update student details, class assignment, and guardians."
      />
      <StudentForm mode="edit" studentId={id} />
    </div>
  );
}
