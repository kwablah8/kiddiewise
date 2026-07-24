import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { cardShellClass } from "@/lib/ui";

/** Placeholder for the fees tabs not yet built (Class Fees, Extra Fees) so the tab bar is complete
 *  and nothing 404s. */
export function FeesComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className={cardShellClass}>
      <EmptyState icon={Wrench} title={`${title} — coming soon`} description={description} />
    </div>
  );
}
