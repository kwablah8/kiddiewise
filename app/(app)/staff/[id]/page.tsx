import { StaffDetail } from "@/components/academics/staff-detail";

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { id } = await params;

  return <StaffDetail id={id} />;
}
