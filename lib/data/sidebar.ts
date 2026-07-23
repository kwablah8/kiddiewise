import { simulate } from "./_devState";
import * as fx from "@/lib/mock/fixtures";
import { store } from "@/lib/mock/store";
import type { SidebarCountsVM } from "@/lib/validators/sidebar";

// students/staff are static demo figures (a populated school reads larger than the ~24 seeded
// students); new_inquiries is derived LIVE from the store so triaging an inquiry updates the
// Admissions badge immediately (useSetInquiryStatus invalidates this query).
export const getSidebarCounts = (): Promise<SidebarCountsVM> =>
  simulate(
    {
      students: fx.mockSidebarCounts.students,
      staff: fx.mockSidebarCounts.staff,
      new_inquiries: store.inquiries.filter((i) => i.status === "new").length,
    },
    { students: 0, staff: 0, new_inquiries: 0 },
  );
