import { PageHeader } from "@/components/app/page-header";
import { AdminDailyReports } from "@/components/daily-reports/admin-daily-reports";

export default function DailyReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        subtitle="Look up any class's daily reports, from both the parent and the teacher."
      />
      <AdminDailyReports />
    </div>
  );
}
