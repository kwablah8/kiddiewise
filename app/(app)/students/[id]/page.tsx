import { StudentProfile } from "@/components/students/student-profile";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;

  return <StudentProfile id={id} />;
}
