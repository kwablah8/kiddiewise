import { ChildFees } from "@/components/parent/child-fees";

interface ParentChildFeesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildFeesPage({ params }: ParentChildFeesPageProps) {
  const { id } = await params;
  return <ChildFees id={id} />;
}
