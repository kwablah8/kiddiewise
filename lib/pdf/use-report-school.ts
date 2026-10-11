"use client";

import { BRAND } from "@/lib/brand";
import { useSchool } from "@/lib/queries/school";
import type { ReportSchool } from "./table-report";

/** The school's name and letterhead details for a report, falling back to the brand until loaded. */
export function useReportSchool(): ReportSchool {
  const { data: school } = useSchool();
  return {
    name: school?.name ?? BRAND.fullName,
    address: school?.address ?? null,
    email: school?.email ?? null,
    phone: school?.phone ?? null,
    logoSrc: school?.logo_url ?? BRAND.crest.src,
  };
}
