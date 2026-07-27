"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import { tenant, activeContext, assertWrite, assertOk, type TenantContext } from "./_server";
import {
  feeStructureCreateSchema,
  bulkAssignFeesSchema,
  assignIndividualFeeSchema,
  extraFeeStructureCreateSchema,
  recordPaymentSchema,
  type FeeStructureCreateInput,
  type BulkAssignFeesInput,
  type AssignIndividualFeeInput,
  type ExtraFeeStructureCreateInput,
  type RecordPaymentInput,
  type FeeTerm,
  type ScholarshipType,
} from "@/lib/validators/fees";

/**
 * Fee writes.
 *
 * Nothing here stores a paid amount, a balance or a status. Those are derived from `payments` by the
 * views in migration 0018 — recording one payment therefore updates the Overview, Class Fees and
 * Payment History together, because all three read the same derivation (golden rule 9). This is why
 * 0017 dropped `invoices.amount_paid` and `invoices.status`.
 */

/** The invoice a payment settles: this student's invoice for the active year and given scope. */
async function findInvoice(
  ctx: TenantContext,
  studentId: string,
  academicYearId: string,
  feeTerm: FeeTerm,
): Promise<string | null> {
  const { data } = await ctx.db
    .from("invoices")
    .select("id")
    .eq("student_id", studentId)
    .eq("academic_year_id", academicYearId)
    .eq("fee_term", feeTerm)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Create or update a student's invoice for a (year, scope).
 *
 * `discount` arrives from the form as a PERCENT but is stored as a cedi amount, so the recorded
 * figure stays correct even if the gross fee is edited later. `total_amount` is the net expected
 * amount after that discount; arrears are tracked separately so the UI can show them as their own
 * column rather than burying them in the fee.
 */
async function upsertInvoice(
  ctx: TenantContext,
  params: {
    studentId: string;
    academicYearId: string;
    termId: string | null;
    feeTerm: FeeTerm;
    gross: number;
    discountPercent: number;
    scholarship: ScholarshipType;
    dueDate: string | null;
  },
): Promise<void> {
  const discount = Math.round((params.gross * params.discountPercent) / 100);

  assertOk(
    await ctx.db.from("invoices").upsert(
      {
        school_id: ctx.schoolId,
        student_id: params.studentId,
        academic_year_id: params.academicYearId,
        // Null for a full-year invoice, which belongs to no single term.
        term_id: params.feeTerm === "full_year" ? null : params.termId,
        fee_term: params.feeTerm,
        total_amount: params.gross - discount,
        discount,
        scholarship_type: params.scholarship,
        due_date: params.dueDate,
      },
      // Re-assigning fees to a class corrects the existing invoices rather than duplicating them.
      { onConflict: "student_id,academic_year_id,fee_term" },
    ),
    "invoice",
  );
}

/** A reusable fee definition for a class + year (+ term scope). */
export async function createFeeStructure(input: FeeStructureCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = feeStructureCreateSchema.parse(input);
    const ctx = await tenant();

    // The class and year names are NOT stored — the read joins them, so renaming a class updates every
    // fee structure that references it instead of leaving stale labels behind.
    const row = assertWrite(
      await ctx.db
        .from("fee_items")
        .insert({
          school_id: ctx.schoolId,
          name: data.description ?? "School fees",
          class_id: data.class_id,
          academic_year_id: data.academic_year_id,
          fee_term: data.term,
          amount: data.amount,
          due_date: data.due_date,
          late_fee: data.late_fee,
          description: data.description,
          is_mandatory: data.is_mandatory,
        })
        .select("id")
        .single(),
      "fee structure",
    );
    return { id: row.id };
  });
}

/** Raise an invoice for every actively-enrolled student in a class. */
export async function bulkAssignFees(input: BulkAssignFeesInput): Promise<ActionResult<{ count: number }>> {
  return attempt(async () => {
    const data = bulkAssignFeesSchema.parse(input);
    const ctx = await tenant();
    const { academicYearId, termId } = await activeContext(ctx);

    if (!academicYearId) {
      throw new UserFacingError("Set an active academic year before assigning fees.");
    }

    const { data: enrolled } = await ctx.db
      .from("enrollments")
      .select("student_id")
      .eq("class_id", data.class_id)
      .eq("academic_year_id", academicYearId)
      .eq("status", "active");

    const students = enrolled ?? [];
    if (students.length === 0) return { count: 0 };

    for (const s of students) {
      await upsertInvoice(ctx, {
        studentId: s.student_id,
        academicYearId,
        termId,
        feeTerm: data.term,
        gross: data.amount,
        discountPercent: data.discount,
        scholarship: data.scholarship_type,
        dueDate: data.due_date,
      });
    }

    return { count: students.length };
  });
}

/** The same invoice write for a single student, with their own discount or scholarship. */
export async function assignIndividualFee(
  input: AssignIndividualFeeInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = assignIndividualFeeSchema.parse(input);
    const ctx = await tenant();
    const { academicYearId, termId } = await activeContext(ctx);

    if (!academicYearId) {
      throw new UserFacingError("Set an active academic year before assigning fees.");
    }

    await upsertInvoice(ctx, {
      studentId: data.student_id,
      academicYearId,
      termId,
      feeTerm: data.term,
      gross: data.amount,
      discountPercent: data.discount,
      scholarship: data.scholarship_type,
      dueDate: data.due_date,
    });

    return { id: data.student_id };
  });
}

/**
 * Record a payment against a student's fees.
 *
 * A payment must settle something — `payments_one_target` requires exactly one of `invoice_id` or
 * `extra_fee_assignment_id` — so an invoice for the active year is required first. Recording money
 * against nothing would be untraceable, which is precisely the failure mode paper receipts have.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = recordPaymentSchema.parse(input);
    const ctx = await tenant();
    const { academicYearId } = await activeContext(ctx);

    if (!academicYearId) {
      throw new UserFacingError("Set an active academic year before recording payments.");
    }

    const invoiceId = await findInvoice(ctx, data.student_id, academicYearId, "full_year");
    if (!invoiceId) {
      throw new UserFacingError(
        "This student has no fees assigned for the active year yet. Assign fees before recording a payment.",
      );
    }

    const row = assertWrite(
      await ctx.db
        .from("payments")
        .insert({
          school_id: ctx.schoolId,
          invoice_id: invoiceId,
          student_id: data.student_id,
          amount: data.amount,
          method: data.method,
          reference: data.reference,
          paid_at: new Date(data.paid_at).toISOString(),
          recorded_by: ctx.profile.id,
        })
        .select("id")
        .single(),
      "payment",
    );

    return { id: row.id };
  });
}

/** An extra-fee definition. `class_id` is null → it applies to all classes. */
export async function createExtraFeeStructure(
  input: ExtraFeeStructureCreateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = extraFeeStructureCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("extra_fee_items")
        .insert({
          school_id: ctx.schoolId,
          name: data.name,
          description: data.description,
          amount: data.amount,
          frequency: data.frequency,
          class_id: null,
        })
        .select("id")
        .single(),
      "extra fee",
      // unique(school_id, name).
      "An extra fee with this name already exists.",
    );
    return { id: row.id };
  });
}
