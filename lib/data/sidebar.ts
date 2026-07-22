import { simulate } from "./_devState";
import * as fx from "@/lib/mock/fixtures";
import type { SidebarCountsVM } from "@/lib/validators/sidebar";

export const getSidebarCounts = (): Promise<SidebarCountsVM> =>
  simulate(fx.mockSidebarCounts, { students: 0, staff: 0 });
