import { z } from "zod";

export const sidebarCountsVM = z.object({
  students: z.number(),
  staff: z.number(),
  new_inquiries: z.number(),
});
export type SidebarCountsVM = z.infer<typeof sidebarCountsVM>;
