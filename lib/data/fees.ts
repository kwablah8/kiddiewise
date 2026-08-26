import { activeYearId, db, unwrapList } from "./_client";
import { summarizeFees } from "@/lib/fees/summary";
import {
  SCHOLARSHIP_LABEL,
  FEE_TERM_LABEL,
  type FeeStructureVM,
  type FeesOverviewVM,
  type PaymentVM,
  type FeesFilter,
  type FeeStatus,
  type StudentFeeVM,
  type ExtraFeeStructureVM,
  type ExtraFeeAssignmentVM,
  type FeeTerm,
  type PaymentMethod,
  type ExtraFeeFrequency,
} from "@/lib/validators/fees";

/**
 * Fees.
 *
 * `paid`, `balance` and `status` are never stored; they are derived from `payments` by the
 * `student_fee_positions` / `extra_fee_positions` views (migration 0018). Migration 0017 dropped the
 * `invoices.amount_paid` and `invoices.status` columns that used to duplicate them, so there is now
 * exactly one answer to "how much has this student paid".
 *
 * The Overview cards are summed by the pure, unit-tested `summarizeFees` helper rather than by a
 * second SQL aggregate, same reason: one implementation of the arithmetic, not two that can drift.
 */

// Postgres cannot prove a view column is NOT NULL, so every column on these two views is typed
// nullable even where the underlying table guarantees a value. Rather than assert that away, each
// read normalises into these concrete shapes with a documented fallback, a numeric that somehow
// arrives null is a zero, and a row with no id could not be rendered or acted on at all.
interface PositionRow {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  fee_term: FeeTerm;
  expected: number;
  discount: number;
  arrears: number;
  scholarship_type: "none" | "partial" | "full" | "bursary";
  paid: number;
  balance: number;
  status: FeeStatus;
}

interface ExtraPositionRow {
  id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  fee_name: string;
  amount: number;
  paid: number;
  balance: number;
  status: FeeStatus;
}

const num = (v: number | string | null): number => (v === null ? 0 : Number(v));

const EMPTY_OVERVIEW: FeesOverviewVM = {
  total_expected: 0,
  total_paid: 0,
  outstanding: 0,
  total_arrears: 0,
  collection_rate: 0,
  extra_total: 0,
  extra_paid: 0,
  extra_balance: 0,
  extra_records: 0,
  fully_paid: 0,
  partial: 0,
  pending: 0,
  total_records: 0,
};

// Read every matching row, not just PostgREST's first page (default 1000). getFeesOverview sums these
// client-side across the whole school, so a truncated read would silently understate the expected /
// collected / outstanding totals a school reconciles its cash against, money is wrong with nothing on
// screen to say so. Page until a short read. (A SQL aggregate RPC would be leaner for a very large
// school; correctness first, and the same paged read also keeps the Class Fees table complete.)
async function readAllPaged<T>(
  make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  label: string,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await make(from, from + pageSize - 1);
    if (error) throw new Error(`${label}: ${error.message}`);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) return all;
  }
}

async function fetchPositions(filter: FeesFilter): Promise<PositionRow[]> {
  const rows = await readAllPaged(
    (from, to) => {
      let q = db()
        .from("student_fee_positions")
        .select(
          `id, student_id, student_name, class_id, class_name, academic_year_id, fee_term,
           expected, discount, arrears, scholarship_type, paid, balance, status`,
        );
      if (filter.class_id) q = q.eq("class_id", filter.class_id);
      if (filter.academic_year_id) q = q.eq("academic_year_id", filter.academic_year_id);
      if (filter.term) q = q.eq("fee_term", filter.term);
      if (filter.student_id) q = q.eq("student_id", filter.student_id);
      return q.range(from, to);
    },
    "student fee positions",
  );

  return rows.flatMap((r) =>
    r.id === null || r.student_id === null
      ? []
      : [
          {
            id: r.id,
            student_id: r.student_id,
            student_name: r.student_name ?? "—",
            class_id: r.class_id,
            class_name: r.class_name,
            fee_term: (r.fee_term ?? "full_year") as FeeTerm,
            expected: num(r.expected),
            discount: num(r.discount),
            arrears: num(r.arrears),
            scholarship_type: r.scholarship_type ?? "none",
            paid: num(r.paid),
            balance: num(r.balance),
            // The view's CASE always yields one of the three; default defensively rather than cast.
            status: (r.status ?? "pending") as FeeStatus,
          },
        ],
  );
}

async function fetchExtraPositions(filter: FeesFilter): Promise<ExtraPositionRow[]> {
  const rows = await readAllPaged(
    (from, to) => {
      // Extra fees are scoped by class only; they carry no year/term of their own.
      let q = db()
        .from("extra_fee_positions")
        .select("id, student_name, class_id, class_name, fee_name, amount, paid, balance, status");
      if (filter.class_id) q = q.eq("class_id", filter.class_id);
      if (filter.student_id) q = q.eq("student_id", filter.student_id);
      return q.range(from, to);
    },
    "extra fee positions",
  );

  return rows.flatMap((r) =>
    r.id === null
      ? []
      : [
          {
            id: r.id,
            student_name: r.student_name ?? "—",
            class_id: r.class_id,
            class_name: r.class_name,
            fee_name: r.fee_name ?? "—",
            amount: num(r.amount),
            paid: num(r.paid),
            balance: num(r.balance),
            status: (r.status ?? "pending") as FeeStatus,
          },
        ],
  );
}

export async function getFeesOverview(filter: FeesFilter = {}): Promise<FeesOverviewVM> {
  const [positions, extras] = await Promise.all([
    fetchPositions(filter),
    fetchExtraPositions(filter),
  ]);
  if (positions.length === 0 && extras.length === 0) return EMPTY_OVERVIEW;

  return summarizeFees(
    positions.map((p) => ({ expected: p.expected, arrears: p.arrears, paid: p.paid })),
    extras.map((e) => ({ amount: e.amount, paid: e.paid })),
  );
}

/** The reusable fee definitions (Class Fees → structures table). */
export async function listFeeStructures(filter: FeesFilter = {}): Promise<FeeStructureVM[]> {
  let q = db()
    .from("fee_items")
    .select(
      `id, class_id, academic_year_id, fee_term, amount, due_date, late_fee, description,
       is_mandatory, classes(name), academic_years(name)`,
    );
  if (filter.class_id) q = q.eq("class_id", filter.class_id);
  if (filter.academic_year_id) q = q.eq("academic_year_id", filter.academic_year_id);
  if (filter.term) q = q.eq("fee_term", filter.term);

  const rows = unwrapList(await q, "fee structures");

  return rows
    .map(
      (f): FeeStructureVM => ({
        id: f.id,
        class_id: f.class_id,
        class_name: f.classes?.name ?? "—",
        academic_year_id: f.academic_year_id,
        academic_year_name: f.academic_years?.name ?? "—",
        term: f.fee_term,
        amount: Number(f.amount),
        due_date: f.due_date,
        late_fee: f.late_fee === null ? null : Number(f.late_fee),
        description: f.description,
        is_mandatory: f.is_mandatory,
      }),
    )
    .sort((a, b) => a.class_name.localeCompare(b.class_name) || a.term.localeCompare(b.term));
}

/** The payments ledger, newest first. Covers both class fees and extra fees. */
export async function listPayments(filter: FeesFilter = {}): Promise<PaymentVM[]> {
  // The class column shows where the student is NOW, so the embed is scoped to the active year,
  // a promoted student carries one enrollment per year and the unscoped embed would pick last
  // year's class.
  const yearId = await activeYearId();
  let q = db()
    .from("payments")
    .select(
      `id, student_id, amount, method, reference, paid_at,
       students(first_name, last_name, enrollments(status, class_id, classes(name))),
       invoices(fee_term),
       extra_fee_assignments(extra_fee_items(name)),
       recorder:profiles!payments_recorded_by_fkey(first_name, last_name)`,
    )
    .order("paid_at", { ascending: false });
  if (yearId) q = q.eq("students.enrollments.academic_year_id", yearId);
  // The parent portal reads this same function for one child (lib/data/parent.ts#getChildFees), so
  // the ledger is shaped in exactly one place for both portals.
  if (filter.student_id) q = q.eq("student_id", filter.student_id);

  const rows = unwrapList(await q, "payments");

  // Class filtered before mapping: the class comes from the student's embedded enrollment, which
  // PostgREST can't filter on without turning the join inner and dropping unenrolled students.
  return rows.flatMap((p) => {
    const enrollment = p.students?.enrollments?.find((e) => e.status === "active") ?? null;
    if (filter.class_id && enrollment?.class_id !== filter.class_id) return [];

    return [
      {
        id: p.id,
        student_id: p.student_id,
        student_name: p.students ? `${p.students.first_name} ${p.students.last_name}` : "—",
        class_name: enrollment?.classes?.name ?? "—",
        amount: Number(p.amount),
        method: p.method as PaymentMethod,
        reference: p.reference,
        paid_at: p.paid_at,
        // What the payment settled: the extra fee's name, or the class fee's term scope.
        fee_label:
          p.extra_fee_assignments?.extra_fee_items?.name ??
          (p.invoices
            ? `${FEE_TERM_LABEL[p.invoices.fee_term as FeeTerm]} school fees`
            : "School fees"),
        // Null when `recorded_by` was cleared by a profile deletion, and, for a PARENT reading
        // this, also when the recorder is another parent's profile, which `profiles_select`
        // (migration 0030) will not return. In practice the recorder is always an admin, whom a
        // parent may read; the receipt falls back to "the school office" either way.
        recorded_by_name: p.recorder ? `${p.recorder.first_name} ${p.recorder.last_name}` : null,
      } satisfies PaymentVM,
    ];
  });
}

/** Per-student fee position for the filtered scope (Class Fees table). */
export async function listClassFees(filter: FeesFilter = {}): Promise<StudentFeeVM[]> {
  const positions = await fetchPositions(filter);

  return positions
    .map(
      (r): StudentFeeVM => ({
        id: r.id,
        student_id: r.student_id,
        student_name: r.student_name,
        class_name: r.class_name ?? "—",
        fee_term: r.fee_term,
        expected: r.expected,
        discount: r.discount,
        // The column holds the enum; the table shows the human label. 'none' reads as no
        // scholarship at all, so it renders as a dash rather than the words "No Scholarship".
        scholarship_type:
          r.scholarship_type === "none" ? null : SCHOLARSHIP_LABEL[r.scholarship_type],
        paid: r.paid,
        arrears: r.arrears,
        balance: r.balance,
        status: r.status,
      }),
    )
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}

/** Extra-fee definitions applying to the filtered class (or to all classes). */
export async function listExtraFeeStructures(
  filter: FeesFilter = {},
): Promise<ExtraFeeStructureVM[]> {
  const rows = unwrapList(
    await db()
      .from("extra_fee_items")
      .select("id, name, description, amount, frequency, class_id, classes(name)")
      .order("name"),
    "extra fee structures",
  );

  return rows
    // A null class_id means school-wide, so it applies whatever class is selected.
    .filter((e) => !filter.class_id || e.class_id === null || e.class_id === filter.class_id)
    .map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      amount: Number(e.amount),
      frequency: e.frequency as ExtraFeeFrequency,
      scope: e.classes?.name ?? "All classes",
    }));
}

/** Assigned extra fees, with balance and status derived from payments. */
export async function listExtraFeeAssignments(
  filter: FeesFilter = {},
): Promise<ExtraFeeAssignmentVM[]> {
  const rows = await fetchExtraPositions(filter);
  return rows
    .map(
      (r): ExtraFeeAssignmentVM => ({
        id: r.id,
        student_name: r.student_name,
        class_name: r.class_name ?? "—",
        fee_name: r.fee_name,
        amount: r.amount,
        paid: r.paid,
        balance: r.balance,
        status: r.status,
      }),
    )
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}
