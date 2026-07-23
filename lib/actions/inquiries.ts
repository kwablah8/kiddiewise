import { store } from "@/lib/mock/store";
import {
  inquiryCreateSchema,
  inquiryStatusUpdateSchema,
  type InquiryCreateInput,
  type InquiryStatusUpdateInput,
} from "@/lib/validators/inquiries";
import { canTransitionInquiry } from "@/lib/inquiries";

// SEAM: real path is an anonymous INSERT into admissions_inquiries — the M2 anon-insert RLS
// already allows this. This mock validates the input and appends it to the in-memory store
// (status "new") so a later Admin → Admissions slice has something to read; the signature here
// is the final contract — only this function's body swaps at integration, no caller changes.
export async function submitInquiry(input: InquiryCreateInput): Promise<{ id: string }> {
  const data = inquiryCreateSchema.parse(input);
  const id = crypto.randomUUID();
  store.addInquiry({
    id,
    ...data,
    status: "new",
    created_at: new Date().toISOString(),
  });
  return { id };
}

// SEAM: real path is `update admissions_inquiries set status = $2 where id = $1` — the admin RLS
// policy (inq_admin_all, 0010) already scopes this to the caller's school. This mock validates the
// input, guards the transition against lib/inquiries#INQUIRY_TRANSITIONS, then mutates the store.
export async function setInquiryStatus(
  input: InquiryStatusUpdateInput,
): Promise<{ id: string }> {
  const { id, status } = inquiryStatusUpdateSchema.parse(input);
  const current = store.inquiries.find((i) => i.id === id);
  if (!current) throw new Error("This inquiry no longer exists.");
  if (!canTransitionInquiry(current.status, status)) {
    throw new Error(`Can't move an inquiry from "${current.status}" to "${status}".`);
  }
  store.updateInquiryStatus(id, status);
  return { id };
}
