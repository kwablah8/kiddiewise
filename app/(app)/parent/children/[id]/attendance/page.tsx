import { ChildAttendance } from "@/components/parent/child-attendance";

interface ParentChildAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildAttendancePage({
  params,
}: ParentChildAttendancePageProps) {
  const { id } = await params;
  return <ChildAttendance id={id} />;
}
