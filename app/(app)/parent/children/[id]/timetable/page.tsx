import { ChildTimetable } from "@/components/parent/child-timetable";

interface ParentChildTimetablePageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildTimetablePage({ params }: ParentChildTimetablePageProps) {
  const { id } = await params;
  return <ChildTimetable id={id} />;
}
