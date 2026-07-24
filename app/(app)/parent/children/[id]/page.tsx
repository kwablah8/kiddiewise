import { ChildProfile } from "@/components/parent/child-profile";

interface ParentChildPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildPage({ params }: ParentChildPageProps) {
  const { id } = await params;
  return <ChildProfile id={id} />;
}
