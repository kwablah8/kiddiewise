import { InquiryDetail } from "@/components/admissions/inquiry-detail";

interface AdmissionsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdmissionsDetailPage({ params }: AdmissionsDetailPageProps) {
  const { id } = await params;

  return <InquiryDetail id={id} />;
}
