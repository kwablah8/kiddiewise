/**
 * The report card's two data blocks, shared by every surface that shows one: the admin/teacher
 * compile dialog and the parent's published card. Both render the SAME columns and the same summary
 * figures as `lib/pdf/report-card.ts` prints, so what a teacher signs off, what a parent reads on
 * their phone, and what comes out of the printer are one card in three places.
 */

/** Structurally what both `ReportSubjectRowVM` and `ChildReportSubjectVM` are. */
export interface ReportCardSubject {
  subject_name: string;
  short_code: string | null;
  class_score: number | null;
  exam_score: number | null;
  total: number | null;
  class_average: number | null;
  class_lowest: number | null;
  class_highest: number | null;
  grade: string | null;
  position: number | null;
  remark: string | null;
}

/** One decimal on every figure, like the printed card. A blank cell stays a dash, never 0.0. */
const dec = (v: number | null): string => (v === null ? "—" : v.toFixed(1));

/** "1/16" — a rank only means something against the size of the group it was taken over. */
const rank = (position: number | null, size: number | null): string =>
  position === null ? "—" : size === null ? String(position) : `${position}/${size}`;

const headCell = "px-2 py-1.5 text-right text-[11px] leading-tight font-medium whitespace-nowrap";
const numCell = "px-2 py-1.5 text-right tabular-nums";

export function ReportCardTable({
  subjects,
  caWeight,
  enrolledCount,
}: {
  subjects: readonly ReportCardSubject[];
  caWeight: number;
  enrolledCount: number | null;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-left text-[var(--muted-foreground)]">
            <th className="py-1.5 pr-2 pl-3 text-[11px] font-medium">Subject</th>
            <th className={headCell}>Code</th>
            <th className={headCell}>
              Class
              <br />
              {caWeight}%
            </th>
            <th className={headCell}>
              Exam
              <br />
              {100 - caWeight}%
            </th>
            <th className={headCell}>
              Total
              <br />
              100%
            </th>
            <th className={headCell}>
              Class
              <br />
              ave.
            </th>
            <th className={headCell}>
              Class
              <br />
              low.
            </th>
            <th className={headCell}>
              Class
              <br />
              high.
            </th>
            <th className={headCell}>Grade</th>
            <th className={headCell}>Pos.</th>
            <th className="py-1.5 pr-3 pl-2 text-[11px] font-medium">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.subject_name} className="border-b border-[var(--border)] last:border-0">
              <td className="py-1.5 pr-2 pl-3 font-medium whitespace-nowrap text-[var(--text)]">
                {s.subject_name}
              </td>
              <td className="px-2 py-1.5 text-right text-[var(--muted-foreground)]">
                {s.short_code ?? "—"}
              </td>
              <td className={numCell}>{dec(s.class_score)}</td>
              <td className={numCell}>{dec(s.exam_score)}</td>
              <td className={`${numCell} font-semibold text-[var(--text)]`}>{dec(s.total)}</td>
              <td className={`${numCell} text-[var(--muted-foreground)]`}>{dec(s.class_average)}</td>
              <td className={`${numCell} text-[var(--muted-foreground)]`}>{dec(s.class_lowest)}</td>
              <td className={`${numCell} text-[var(--muted-foreground)]`}>{dec(s.class_highest)}</td>
              <td className={`${numCell} font-medium`}>{s.grade ?? "—"}</td>
              <td className={numCell}>{rank(s.position, enrolledCount)}</td>
              <td className="py-1.5 pr-3 pl-2 whitespace-nowrap text-[var(--muted-foreground)]">
                {s.remark ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ReportCardTotals {
  passes: number | null;
  total_score: number | null;
  average_score: number | null;
  class_average: number | null;
  class_lowest_average: number | null;
  class_highest_average: number | null;
  position: number | null;
  enrolled_count: number | null;
  level_position: number | null;
  level_size: number | null;
}

/** The eight figures the card prints under the table. */
export function ReportCardSummary({
  totals,
  levelName,
}: {
  totals: ReportCardTotals;
  levelName: string | null;
}) {
  const figures: [string, string][] = [
    ["Passes", totals.passes === null ? "—" : String(totals.passes)],
    ["Total score", dec(totals.total_score)],
    ["Average score", dec(totals.average_score)],
    ["Class average", dec(totals.class_average)],
    ["Lowest class ave.", dec(totals.class_lowest_average)],
    ["Highest class ave.", dec(totals.class_highest_average)],
    ["Position in class", rank(totals.position, totals.enrolled_count)],
    [
      `Position in ${levelName ?? "level"}`,
      rank(totals.level_position, totals.level_size),
    ],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-[var(--bg)] px-4 py-3 sm:grid-cols-4">
      {figures.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="truncate text-[10px] font-semibold tracking-[0.08em] text-[var(--label)] uppercase">
            {label}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
