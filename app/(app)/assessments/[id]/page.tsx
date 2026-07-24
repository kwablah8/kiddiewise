import { AssessmentDetail } from "@/components/assessments/assessment-detail";

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params;
  return <AssessmentDetail id={id} />;
}
