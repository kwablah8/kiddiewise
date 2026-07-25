import { PageHeader } from "@/components/app/page-header";
import { TerminalReports } from "@/components/reports/terminal-reports";

export default function TerminalReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Terminal Reports"
        subtitle="Generate end-of-term reports, add remarks, and publish them to parents."
      />
      <TerminalReports />
    </div>
  );
}
