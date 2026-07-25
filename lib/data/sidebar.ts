import { db, unwrapSingleRow } from "./_client";
import type { SidebarCountsVM } from "@/lib/validators/sidebar";

/** The three sidebar badge counts, in one round trip (see the `sidebar_counts` RPC in 0018). */
export async function getSidebarCounts(): Promise<SidebarCountsVM> {
  const row = unwrapSingleRow(await db().rpc("sidebar_counts"), "sidebar_counts");
  if (!row) return { students: 0, staff: 0, new_inquiries: 0 };
  return {
    students: Number(row.students),
    staff: Number(row.staff),
    new_inquiries: Number(row.new_inquiries),
  };
}
