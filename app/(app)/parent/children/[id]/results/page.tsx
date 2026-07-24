import { ChildResults } from "@/components/parent/child-results";

interface ParentChildResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildResultsPage({ params }: ParentChildResultsPageProps) {
  const { id } = await params;
  return <ChildResults id={id} />;
}
