import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";

// Placeholder — the next unit replaces this with the real dashboard (metric cards, trend
// charts, activity/events panels, class performance table) consuming the Task 1.3 hooks.
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your school's students, staff, fees, and activity."
      />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <EmptyState icon={LayoutDashboard} title="Dashboard coming up" />
      </div>
    </div>
  );
}
