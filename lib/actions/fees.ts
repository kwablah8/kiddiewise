import { store } from "@/lib/mock/store";
import {
  feeStructureCreateSchema,
  bulkAssignFeesSchema,
  assignIndividualFeeSchema,
  extraFeeStructureCreateSchema,
  type FeeStructureCreateInput,
  type BulkAssignFeesInput,
  type AssignIndividualFeeInput,
  type ExtraFeeStructureCreateInput,
} from "@/lib/validators/fees";

// SEAM: becomes a Server Action writing to `fee_items` / `invoices`; signature + validation stay
// identical. Resolves class/year names so the stored structure carries its display labels.
export async function createFeeStructure(input: FeeStructureCreateInput): Promise<{ id: string }> {
  const data = feeStructureCreateSchema.parse(input);
  const cls = store.classes.find((c) => c.id === data.class_id);
  const year = store.academicYears.find((y) => y.id === data.academic_year_id);
  if (!cls) throw new Error("Class not found.");
  if (!year) throw new Error("Academic year not found.");
  const id = crypto.randomUUID();
  store.addFeeStructure({
    id,
    class_id: cls.id,
    class_name: cls.name,
    academic_year_id: year.id,
    academic_year_name: year.name,
    term: data.term,
    amount: data.amount,
    due_date: data.due_date ?? null,
    late_fee: data.late_fee ?? null,
    description: data.description ?? null,
    is_mandatory: data.is_mandatory,
  });
  return { id };
}

// SEAM: real path upserts an invoice per active student in the class. The mock returns the count
// of students that would be billed so the UI can confirm the action.
export async function bulkAssignFees(input: BulkAssignFeesInput): Promise<{ count: number }> {
  const data = bulkAssignFeesSchema.parse(input);
  const count = store.students.filter(
    (s) => s.class_id === data.class_id && s.enrollment_status === "active",
  ).length;
  return { count };
}

// SEAM: real path upserts one invoice for the chosen student.
export async function assignIndividualFee(
  input: AssignIndividualFeeInput,
): Promise<{ id: string }> {
  const data = assignIndividualFeeSchema.parse(input);
  if (!store.students.some((s) => s.id === data.student_id)) throw new Error("Student not found.");
  return { id: data.student_id };
}

export async function createExtraFeeStructure(
  input: ExtraFeeStructureCreateInput,
): Promise<{ id: string }> {
  const data = extraFeeStructureCreateSchema.parse(input);
  const id = crypto.randomUUID();
  store.addExtraFeeStructure({
    id,
    name: data.name,
    description: data.description ?? null,
    amount: data.amount,
    frequency: data.frequency,
    scope: "All classes",
  });
  return { id };
}
