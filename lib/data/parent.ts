import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { childrenOf } from "@/lib/parent/scope";
import type { ChildSummaryVM, ParentAnnouncementVM } from "@/lib/validators/parent";

// SEAM: real path is `select … from students join student_guardians … where guardian = auth.uid()`,
// enforced by RLS. Here we scope in-memory via the pure `childrenOf` helper.
export function getParentChildren(parentId: string): Promise<ChildSummaryVM[]> {
  return simulate(childrenOf(parentId, store.students), []);
}

// SEAM: real path filters announcements by school + audience via RLS; the mock set is school-wide,
// so `parentId` is unused today but kept in the signature for a clean seam swap.
export function getParentAnnouncements(parentId: string): Promise<ParentAnnouncementVM[]> {
  void parentId;
  const visible = store.announcements
    .filter((a) => a.audience === "parents" || a.audience === "everyone")
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  return simulate(visible, []);
}
