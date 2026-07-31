import { ChildDailyReport } from "@/components/parent/child-daily-report";

interface ParentChildDailyReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentChildDailyReportPage({
  params,
}: ParentChildDailyReportPageProps) {
  const { id } = await params;
  return <ChildDailyReport id={id} />;
}
