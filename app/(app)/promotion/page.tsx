import { PageHeader } from "@/components/app/page-header";
import { PromotionBoard } from "@/components/promotion/promotion-board";

export default function PromotionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotion"
        subtitle="Move a class into next year — promote, repeat or graduate each student."
      />
      <PromotionBoard />
    </div>
  );
}
