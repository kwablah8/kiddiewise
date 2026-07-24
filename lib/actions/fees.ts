import { store } from "@/lib/mock/store";
import { feeStructureCreateSchema, type FeeStructureCreateInput } from "@/lib/validators/fees";

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
