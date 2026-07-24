import { PageHeader } from "@/components/app/page-header";
import { StudentForm } from "@/components/students/student-form";

interface NewStudentPageProps {
  searchParams: Promise<{ fromInquiry?: string }>;
}

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const { fromInquiry } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Student"
        subtitle="Add a student record, assign a class, and link guardians."
        backHref="/students"
        backLabel="Students"
      />
      <StudentForm mode="create" fromInquiryId={fromInquiry} />
    </div>
  );
}
