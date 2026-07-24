import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { cardShellClass } from "@/lib/ui";

// Slice 1 ships this placeholder so the dashboard cards + child switcher have a valid target;
// Slice 2 replaces it with the real profile + attendance, Slice 3 adds results.
export default function ParentChildPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Child details" subtitle="Profile, attendance and results are coming soon." />
      <div className={cardShellClass}>
        <EmptyState
          title="Coming soon"
          description="Your child's profile, attendance history and results will appear here shortly."
        />
      </div>
    </div>
  );
}
