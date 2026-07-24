import { simulate } from "./_devState";
import { store } from "@/lib/mock/store";
import { childrenOf, isGuardianOf } from "@/lib/parent/scope";
import { scoreToGrade } from "@/lib/grading";
import type {
  ChildProfileVM,
  ChildResultsVM,
  ChildSummaryVM,
  AttendanceRecordVM,
  ParentAnnouncementVM,
  TerminalReportVM,
} from "@/lib/validators/parent";

// The current term's display name (SEAM: real path reads the active term for the school).
function activeTermName(): string {
  return store.terms.find((t) => t.is_active)?.name ?? "This term";
}

// SEAM: real path is `select … from students join student_guardians … where guardian = auth.uid()`,
// enforced by RLS. Here we scope in-memory via the pure `childrenOf` helper.
export function getParentChildren(parentId: string): Promise<ChildSummaryVM[]> {
  return simulate(childrenOf(parentId, store.students), []);
}

// SEAM: real path filters announcements by school + audience via RLS; the mock set is school-wide,
// so `parentId` is unused today but kept in the signature for a clean seam swap.
export function getParentAnnouncements(parentId: string): Promise<ParentAnnouncementVM[]> {
  void parentId;
  const visible = store.announcements
    .filter((a) => a.audience === "parents" || a.audience === "everyone")
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  return simulate(visible, []);
}

// Child profile — the student's own details + the teachers who take their class. Gated on the
// guardian link (SEAM: RLS via student_guardians); a non-linked childId resolves to null so a
// parent can never read another family's child.
export function getChildProfile(parentId: string, childId: string): Promise<ChildProfileVM | null> {
  if (!isGuardianOf(parentId, childId, store.students)) return simulate(null, null);
  const s = store.students.find((x) => x.id === childId);
  if (!s) return simulate(null, null);

  const teachers: { name: string; subject: string }[] = [];
  if (s.class_id) {
    const cls = store.classes.find((c) => c.id === s.class_id);
    if (cls?.class_teacher_id) {
      const t = store.staff.find((st) => st.id === cls.class_teacher_id);
      if (t) teachers.push({ name: `${t.first_name} ${t.last_name}`, subject: "Class teacher" });
    }
    for (const cs of store.classSubjects.filter((a) => a.class_id === s.class_id)) {
      const t = cs.teacher_id ? store.staff.find((st) => st.id === cs.teacher_id) : null;
      const subj = store.subjects.find((su) => su.id === cs.subject_id);
      if (t && subj) teachers.push({ name: `${t.first_name} ${t.last_name}`, subject: subj.name });
    }
  }

  const profile: ChildProfileVM = {
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    other_names: s.other_names,
    photo_url: s.photo_url,
    admission_no: s.admission_no,
    date_of_birth: s.date_of_birth,
    gender: s.gender,
    class_name: s.class_name,
    teachers,
  };
  // `empty` state → null (renders the friendly not-found), `success` → the profile.
  return simulate(profile, null);
}

// Child attendance history (newest first). Gated on the guardian link like the profile.
export function getChildAttendance(
  parentId: string,
  childId: string,
): Promise<AttendanceRecordVM[]> {
  if (!isGuardianOf(parentId, childId, store.students)) return simulate([], []);
  const records = store.attendance
    .filter((a) => a.student_id === childId)
    .map((a) => ({ date: a.date, status: a.status }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return simulate(records, []);
}

// Child term results — per-subject scores with grade/remark derived from the school's grade bands
// (scores are out of 100). Guardian-gated; a non-linked child resolves to null.
export function getChildResults(parentId: string, childId: string): Promise<ChildResultsVM | null> {
  if (!isGuardianOf(parentId, childId, store.students)) return simulate(null, null);
  const termName = activeTermName();
  const subjects = store.childSubjectResults
    .filter((r) => r.student_id === childId)
    .map((r) => {
      const g = scoreToGrade(r.score, 100, store.gradeBands);
      return {
        subject: r.subject,
        score: r.score,
        grade: g?.grade ?? "—",
        remark: g?.remark ?? "—",
        teacher_comment: r.teacher_comment,
      };
    });
  const vm: ChildResultsVM = { term_name: termName, subjects };
  // `empty` state → a term with no submitted results yet.
  return simulate(vm, { term_name: termName, subjects: [] });
}

// The published terminal report for a child's current term. Only published reports are returned;
// an unpublished/absent one resolves to null (SEAM: RLS checks is_published).
export function getChildReport(parentId: string, childId: string): Promise<TerminalReportVM | null> {
  if (!isGuardianOf(parentId, childId, store.students)) return simulate(null, null);
  const rep = store.terminalReports.find((r) => r.student_id === childId && r.published);
  if (!rep) return simulate(null, null);
  const scores = store.childSubjectResults.filter((r) => r.student_id === childId);
  const average = scores.length
    ? Math.round(scores.reduce((sum, r) => sum + r.score, 0) / scores.length)
    : null;
  const overall = average !== null ? scoreToGrade(average, 100, store.gradeBands) : null;
  const vm: TerminalReportVM = {
    id: `rep-${childId}`,
    term_name: activeTermName(),
    published: true,
    overall_average: average,
    overall_grade: overall?.grade ?? null,
    class_teacher_remark: rep.class_teacher_remark,
  };
  return simulate(vm, null);
}
