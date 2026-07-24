import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Styled "coming soon" screen for a route whose feature ships in a later slice. */
export function PortalPlaceholder({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className={cn(cardShellClass, "py-4")}>
        <EmptyState icon={Hammer} title="Coming soon" description={description} />
      </div>
    </div>
  );
}
