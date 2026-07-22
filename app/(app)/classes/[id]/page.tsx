import { ClassDetail } from "@/components/academics/class-detail";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params;

  return <ClassDetail id={id} />;
}
