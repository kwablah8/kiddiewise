"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ActiveContextBanner } from "@/components/academics/active-context-banner";
import { YearList } from "@/components/academics/year-list";
import { TermList } from "@/components/academics/term-list";
import { useAcademicYears } from "@/lib/queries/academics";

export default function AcademicPage() {
  const { data: years } = useAcademicYears();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  // Default to the active year (or the first one) until the admin picks a different row,
  // derived rather than synced via an effect, so there's no stale-state window on first load.
  const effectiveYearId =
    selectedYearId ?? years?.find((y) => y.is_active)?.id ?? years?.[0]?.id ?? null;
  const selectedYear = years?.find((y) => y.id === effectiveYearId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Setup"
        subtitle="Manage academic years, terms, and the active school calendar."
      />
      <ActiveContextBanner />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <YearList selectedYearId={effectiveYearId} onSelectYear={setSelectedYearId} />
        <TermList year={selectedYear} />
      </div>
    </div>
  );
}
