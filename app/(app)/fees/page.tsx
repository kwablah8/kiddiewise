"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { FeesTabs, type FeesTab } from "@/components/fees/fees-tabs";
import { FeesFilters } from "@/components/fees/fees-filters";
import { FeesOverview } from "@/components/fees/fees-overview";
import { FeeStructureTab } from "@/components/fees/fee-structure-tab";
import { PaymentHistoryTab } from "@/components/fees/payment-history-tab";
import { FeesComingSoon } from "@/components/fees/fees-coming-soon";
import type { FeesFilter } from "@/lib/validators/fees";

export default function FeesPage() {
  const [tab, setTab] = useState<FeesTab>("overview");
  const [filter, setFilter] = useState<FeesFilter>({});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Management"
        subtitle="Manage fee structures, class fees, payments, discounts, and arrears."
      />

      <FeesTabs active={tab} onChange={setTab} />
      <FeesFilters filter={filter} onChange={setFilter} />

      {tab === "overview" && <FeesOverview filter={filter} />}
      {tab === "structure" && <FeeStructureTab filter={filter} />}
      {tab === "class" && (
        <FeesComingSoon
          title="Class Fees"
          description="Bulk-assign fees to a class, with scholarships and discounts. Coming next."
        />
      )}
      {tab === "extra" && (
        <FeesComingSoon
          title="Extra Fees"
          description="Create extra-fee structures, assign them to students, and manage fee types. Coming next."
        />
      )}
      {tab === "payments" && <PaymentHistoryTab filter={filter} />}
    </div>
  );
}
