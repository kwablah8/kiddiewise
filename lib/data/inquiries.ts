import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import type { InquiryVM } from "@/lib/validators/inquiries";

// Newest first — admins triage the most recent inquiries at the top.
function byNewest(a: InquiryVM, b: InquiryVM): number {
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
}

// The list is small; the component filters by status/search client-side (instant tabs), so this
// returns the full set. SEAM: real path is `select * from admissions_inquiries order by created_at desc`.
export function listInquiries(): Promise<InquiryVM[]> {
  const result = store.inquiries.map((i) => ({ ...i })).sort(byNewest);
  return simulate(result, []);
}

export function getInquiry(id: string): Promise<InquiryVM | null> {
  const found = store.inquiries.find((i) => i.id === id) ?? null;
  return simulate(found ? { ...found } : null, null);
}
