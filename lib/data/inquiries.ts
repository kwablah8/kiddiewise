import { db, unwrapList, unwrapMaybe } from "./_client";
import type { InquiryVM } from "@/lib/validators/inquiries";

const SELECT =
  "id, applicant_name, parent_name, parent_email, parent_phone, desired_class, message, status, created_at";

/**
 * Every inquiry, newest first — admins triage the most recent at the top. The whole set is returned
 * because the Admissions screen filters by status and search client-side for instant tab switching;
 * an admissions inbox is small enough that paging it would cost more than it saves.
 */
export async function listInquiries(): Promise<InquiryVM[]> {
  return unwrapList(
    await db()
      .from("admissions_inquiries")
      .select(SELECT)
      .order("created_at", { ascending: false }),
    "inquiries",
  );
}

export async function getInquiry(id: string): Promise<InquiryVM | null> {
  return unwrapMaybe(
    await db().from("admissions_inquiries").select(SELECT).eq("id", id).single(),
    "inquiry",
  );
}
