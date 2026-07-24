import { AssessmentDetail } from "@/components/assessments/assessment-detail";

interface TeacherAssessmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherAssessmentDetailPage({ params }: TeacherAssessmentDetailPageProps) {
  const { id } = await params;
  return <AssessmentDetail id={id} backHref="/teacher/assessment" />;
}
