"use client";

import { useState } from "react";
import { ChevronRight, Loader2, NotebookPen, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ParentSectionSummary } from "@/components/daily-reports/section-views";
import { cardShellClass } from "@/lib/ui";
import { useTeacherClasses } from "@/lib/queries/teacher";
import {
  useClassDailyStatus,
  useDailyReport,
  useSaveTeacherDailyReport,
} from "@/lib/queries/daily-reports";
import {
  dailyActivity,
  DAILY_ACTIVITY_LABEL,
  DAILY_PORTION_LABEL,
  DAILY_LESSON_MOOD_LABEL,
  DAILY_PLAY_MOOD_LABEL,
  type DailyStatusRowVM,
  type TeacherDailySectionVM,
  type TeacherDailyReportInput,
  type ToiletingEntry,
} from "@/lib/validators/daily-reports";

const textareaClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** The teacher's daily-report sheet: pick a class and day, see who's filled, open a child. */
export function TeacherDailyReport({ teacherId }: { teacherId: string }) {
  const { data: classes, isLoading: classesLoading } = useTeacherClasses(teacherId);
  const [classId, setClassId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [openStudent, setOpenStudent] = useState<DailyStatusRowVM | null>(null);

  const { data: rows, isLoading, isError, refetch } = useClassDailyStatus(classId, date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId} disabled={classesLoading}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={classesLoading ? "Loading classes…" : "Select a class"}>
                {(v: string) => {
                  if (classesLoading) return "Loading classes…";
                  const c = (classes ?? []).find((x) => x.id === v);
                  return c ? `${c.name} · ${c.level}` : "Select a class";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dr-date">Date</Label>
          <Input
            id="dr-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {!classId ? (
        <div className={cardShellClass}>
          <EmptyState
            icon={NotebookPen}
            title="Select a class and date"
            description="Choose a class to see each child's daily report."
          />
        </div>
      ) : isError ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load the class list." onRetry={() => refetch()} />
        </div>
      ) : isLoading ? (
        <div className={cardShellClass}>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className={cardShellClass}>
          <EmptyState
            icon={NotebookPen}
            title="No students enrolled"
            description="This class has no active students for the current academic year."
          />
        </div>
      ) : (
        <div className={cardShellClass}>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((r) => (
              <li key={r.student_id}>
                <button
                  type="button"
                  onClick={() => setOpenStudent(r)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{r.student_name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{r.admission_no}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusPill
                      label={r.parent_submitted ? "Parent ✓" : "Parent —"}
                      tone={r.parent_submitted ? "success" : "neutral"}
                    />
                    <StatusPill
                      label={r.teacher_submitted ? "Teacher ✓" : "Teacher —"}
                      tone={r.teacher_submitted ? "success" : "neutral"}
                    />
                    <ChevronRight className="size-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openStudent && (
        <StudentDayDialog
          key={`${openStudent.student_id}-${date}`}
          student={openStudent}
          date={date}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}

function StudentDayDialog({
  student,
  date,
  onClose,
}: {
  student: DailyStatusRowVM;
  date: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, refetch } = useDailyReport(student.student_id, date);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student.student_name}</DialogTitle>
          <DialogDescription>Daily report · {date}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <ErrorState message="Couldn't load this report." onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)]">Parent&apos;s report about the child</h3>
              <div className="mt-3">
                <ParentSectionSummary parent={data.parent} />
              </div>
            </section>

            <section className="border-t border-[var(--border)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Teacher&apos;s report about the child</h3>
              <div className="mt-3">
                <TeacherDayForm studentId={student.student_id} date={date} initial={data.teacher} onSaved={onClose} />
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type TeacherFormState = Omit<TeacherDailyReportInput, "student_id" | "date">;

const EMPTY_TEACHER_FORM: TeacherFormState = {
  toileting: [],
  nap_start: null,
  nap_wake: null,
  activities: [],
  breakfast: null,
  lunch: null,
  snack: null,
  medication_given: null,
  mood_lessons: null,
  mood_play: null,
  teacher_comments: null,
};

const NONE = "__none__";

/**
 * Controlled state rather than RHF, deliberately: every field is nullable (a half-filled day
 * sheet is a valid state), the toileting log is a dynamic list, and there is nothing for a
 * resolver to reject — the structure of the controls IS the validation, and the Zod contract
 * still runs in the action.
 */
function TeacherDayForm({
  studentId,
  date,
  initial,
  onSaved,
}: {
  studentId: string;
  date: string;
  initial: TeacherDailySectionVM | null;
  onSaved: () => void;
}) {
  const save = useSaveTeacherDailyReport();
  const [form, setForm] = useState<TeacherFormState>(() =>
    initial
      ? {
          toileting: initial.toileting,
          nap_start: initial.nap_start,
          nap_wake: initial.nap_wake,
          activities: initial.activities,
          breakfast: initial.breakfast,
          lunch: initial.lunch,
          snack: initial.snack,
          medication_given: initial.medication_given,
          mood_lessons: initial.mood_lessons,
          mood_play: initial.mood_play,
          teacher_comments: initial.teacher_comments,
        }
      : EMPTY_TEACHER_FORM,
  );

  const set = <K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const text = (v: string): string | null => (v.trim() === "" ? null : v);

  function setToileting(index: number, patch: Partial<ToiletingEntry>) {
    setForm((f) => ({
      ...f,
      toileting: f.toileting.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }

  async function onSave() {
    try {
      await save.mutateAsync({ student_id: studentId, date, ...form });
      toast.success("Daily report saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the report. Please try again.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Diapering / toileting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Diapering / Toileting</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={form.toileting.length >= 12}
            onClick={() =>
              set("toileting", [...form.toileting, { time: "", wet: false, dry: false, description: "" }])
            }
          >
            <Plus className="size-3.5" aria-hidden="true" /> Add entry
          </Button>
        </div>
        {form.toileting.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No entries recorded.</p>
        ) : (
          <div className="space-y-2">
            {form.toileting.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input
                  type="time"
                  value={t.time}
                  onChange={(e) => setToileting(i, { time: e.target.value })}
                  className="w-28"
                  aria-label={`Entry ${i + 1} time`}
                />
                <label className="flex items-center gap-1.5 text-sm text-[var(--text)]">
                  <Checkbox checked={t.wet} onCheckedChange={(v) => setToileting(i, { wet: v === true })} />
                  Wet
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[var(--text)]">
                  <Checkbox checked={t.dry} onCheckedChange={(v) => setToileting(i, { dry: v === true })} />
                  Dry
                </label>
                <Input
                  value={t.description}
                  onChange={(e) => setToileting(i, { description: e.target.value })}
                  placeholder="Description"
                  className="min-w-32 flex-1"
                  aria-label={`Entry ${i + 1} description`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove entry ${i + 1}`}
                  onClick={() => set("toileting", form.toileting.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Naptime */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dr-nap-start">Naptime — time to sleep</Label>
          <Input
            id="dr-nap-start"
            type="time"
            value={form.nap_start ?? ""}
            onChange={(e) => set("nap_start", text(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dr-nap-wake">Time awake</Label>
          <Input
            id="dr-nap-wake"
            type="time"
            value={form.nap_wake ?? ""}
            onChange={(e) => set("nap_wake", text(e.target.value))}
          />
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-2">
        <Label>Today&apos;s activities</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {dailyActivity.options.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm text-[var(--text)]">
              <Checkbox
                checked={form.activities.includes(a)}
                onCheckedChange={(v) =>
                  set(
                    "activities",
                    v === true ? [...form.activities, a] : form.activities.filter((x) => x !== a),
                  )
                }
              />
              {DAILY_ACTIVITY_LABEL[a]}
            </label>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      <div className="grid grid-cols-3 gap-4">
        {(["breakfast", "lunch", "snack"] as const).map((meal) => (
          <div key={meal} className="space-y-1.5">
            <Label className="capitalize">{meal} ate</Label>
            <Select
              value={form[meal] ?? NONE}
              onValueChange={(v) => set(meal, !v || v === NONE ? null : (v as TeacherFormState["breakfast"]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => (v === NONE ? "—" : DAILY_PORTION_LABEL[v as keyof typeof DAILY_PORTION_LABEL])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {Object.entries(DAILY_PORTION_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Medication */}
      <div className="space-y-1.5">
        <Label htmlFor="dr-medication">Medication (name, amount, time, staff initial)</Label>
        <Input
          id="dr-medication"
          value={form.medication_given ?? ""}
          onChange={(e) => set("medication_given", text(e.target.value))}
          placeholder="e.g. Paracetamol · 5ml · 12:30 · E.O."
        />
      </div>

      {/* Mood */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>During lessons the child was</Label>
          <Select
            value={form.mood_lessons ?? NONE}
            onValueChange={(v) => set("mood_lessons", !v || v === NONE ? null : (v as TeacherFormState["mood_lessons"]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) =>
                  v === NONE ? "—" : DAILY_LESSON_MOOD_LABEL[v as keyof typeof DAILY_LESSON_MOOD_LABEL]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {Object.entries(DAILY_LESSON_MOOD_LABEL).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>At play the child</Label>
          <Select
            value={form.mood_play ?? NONE}
            onValueChange={(v) => set("mood_play", !v || v === NONE ? null : (v as TeacherFormState["mood_play"]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) =>
                  v === NONE ? "—" : DAILY_PLAY_MOOD_LABEL[v as keyof typeof DAILY_PLAY_MOOD_LABEL]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {Object.entries(DAILY_PLAY_MOOD_LABEL).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-1.5">
        <Label htmlFor="dr-comments">Comments / special request from teacher (homework)</Label>
        <textarea
          id="dr-comments"
          rows={3}
          className={textareaClass}
          value={form.teacher_comments ?? ""}
          onChange={(e) => set("teacher_comments", text(e.target.value))}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onSave} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save Report
        </Button>
      </div>
    </div>
  );
}
