import { store } from "@/lib/mock/store";
import { saveAttendanceSchema, type SaveAttendanceInput } from "@/lib/validators/attendance";

// SEAM: becomes a Server Action. The real version sets marked_by = auth.uid() and relies on RLS
// (teacher_teaches_class); signature + validation stay identical, only the body swaps.
export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<{ ok: true; count: number }> {
  const { class_id, date, entries } = saveAttendanceSchema.parse(input);
  const term = store.terms.find((t) => t.is_active) ?? null;
  const count = store.upsertAttendance(entries, {
    class_id,
    date,
    term_id: term?.id ?? "",
    marked_by: null,
  });
  return { ok: true, count };
}
