import { PageHeader } from "@/components/app/page-header";
import { CanteenMenuEditor } from "@/components/canteen/canteen-menu-editor";

export default function CanteenPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Canteen"
        subtitle="Set this week's menu. Publish a day to make it visible to parents."
      />
      <CanteenMenuEditor />
    </div>
  );
}
