import { store } from "@/lib/mock/store";
import { inquiryCreateSchema, type InquiryCreateInput } from "@/lib/validators/inquiries";

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
