"use server";

import { createClient } from "@/lib/supabase/server";
import { tenant, assertWrite, assertOk, publicSchoolId } from "./_server";
import {
  inquiryCreateSchema,
  inquiryStatusUpdateSchema,
  type InquiryCreateInput,
  type InquiryStatusUpdateInput,
} from "@/lib/validators/inquiries";
import { canTransitionInquiry } from "@/lib/inquiries";

/**
 * The public admissions/contact form — the ONLY write an unauthenticated visitor can make
 * (`inq_anon_insert`, migration 0010).
 *
 * `status` and `school_id` are set here, not accepted from the form: a visitor must not be able to
 * file an inquiry as already-accepted, nor aim one at another school's inbox.
 *
 * Deliberately does NOT ask for the inserted row back. `anon` holds INSERT but not SELECT on this
 * table, so adding `.select()` appends a RETURNING clause and the whole statement fails with 42501.
 * Postgres helpfully suggests `GRANT SELECT ... TO anon` — following that would let any visitor read
 * every inquiry ever submitted, exposing the name, email and phone number of every family who has
 * ever enquired. Write-only is the correct shape for a public form: the visitor needs confirmation it
 * was received, not the row.
 */
export async function submitInquiry(input: InquiryCreateInput): Promise<{ ok: true }> {
  const data = inquiryCreateSchema.parse(input);
  const schoolId = await publicSchoolId();
  const db = await createClient();

  assertOk(
    await db
      .from("admissions_inquiries")
      .insert({ ...data, school_id: schoolId, status: "new" }),
    "inquiry",
    "We couldn't submit your enquiry just now. Please try again, or call the school office.",
  );

  return { ok: true };
}

/**
 * Move an inquiry through the admissions pipeline.
 *
 * The transition guard is the reason this is a Server Action and not a plain UPDATE from the browser.
 * RLS decides WHO may write the row; it says nothing about WHICH transitions are legal. A bare
 * client-side update would silently drop the state machine — letting an inquiry jump from `new`
 * straight to `converted`, or mutating a row that was already rejected. Read-check-write happens here,
 * where the client cannot skip it.
 */
export async function setInquiryStatus(input: InquiryStatusUpdateInput): Promise<{ id: string }> {
  const { id, status } = inquiryStatusUpdateSchema.parse(input);
  const ctx = await tenant();

  const { data: current } = await ctx.db
    .from("admissions_inquiries")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!current) throw new Error("This inquiry no longer exists.");
  if (!canTransitionInquiry(current.status, status)) {
    throw new Error(`Can't move an inquiry from "${current.status}" to "${status}".`);
  }

  const row = assertWrite(
    await ctx.db.from("admissions_inquiries").update({ status }).eq("id", id).select("id").single(),
    "inquiry",
  );

  return { id: row.id };
}
