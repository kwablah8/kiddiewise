"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { ChildTabs } from "@/components/parent/child-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { TeacherSectionSummary } from "@/components/daily-reports/section-views";
import { useDailyReport, useSaveParentDailyReport } from "@/lib/queries/daily-reports";
import {
  DAILY_SLEEP_LABEL,
  DAILY_CHILD_MOOD_LABEL,
  type ParentDailyReportInput,
  type ParentDailySectionVM,
} from "@/lib/validators/daily-reports";
import { cardShellClass } from "@/lib/ui";

const textareaClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** The parent's side of the daily report: fill the morning section, read the teacher's back. */
export function ChildDailyReport({ id }: { id: string }) {
  const [date, setDate] = useState<string>(todayISO());
  const { data, isLoading, isError, refetch } = useDailyReport(id, date);

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      <div className="space-y-1.5">
        <Label htmlFor="cdr-date">Date</Label>
        <Input
          id="cdr-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-40 w-full" />
        </div>
      ) : isError || !data ? (
        <div className={cardShellClass}>
          <ErrorState message="Couldn't load the daily report." onRetry={() => refetch()} />
        </div>
      ) : (
        <>
          <section className={cardShellClass}>
            <h3 className="text-base font-semibold text-[var(--text)]">Your report about your child</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Fill this in before or at drop-off — the class teacher reads it during the day.
            </p>
            <div className="mt-4">
              <ParentDayForm key={`${id}-${date}`} studentId={id} date={date} initial={data.parent} />
            </div>
          </section>

          <section className={cardShellClass}>
            <h3 className="text-base font-semibold text-[var(--text)]">
              Teacher&apos;s report about your child
            </h3>
            <div className="mt-4">
              <TeacherSectionSummary teacher={data.teacher} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

type ParentFormState = Omit<ParentDailyReportInput, "student_id" | "date">;

const EMPTY_PARENT_FORM: ParentFormState = {
  slept: null,
  seems: null,
  comments: null,
  ate_before_school: null,
  feeding_time: null,
  food: null,
  portion: null,
  had_medication: null,
  medication_details: null,
  medication_reason: null,
  special_requests: null,
  pickup_info: null,
  parent_comments: null,
};

const NONE = "__none__";
const YESNO_LABEL = { yes: "Yes", no: "No" } as const;

// Controlled state, not RHF — same reasoning as the teacher form: every field is nullable and
// the controls' structure is the validation; the Zod contract runs in the action.
function ParentDayForm({
  studentId,
  date,
  initial,
}: {
  studentId: string;
  date: string;
  initial: ParentDailySectionVM | null;
}) {
  const save = useSaveParentDailyReport();
  const [form, setForm] = useState<ParentFormState>(() =>
    initial
      ? {
          slept: initial.slept,
          seems: initial.seems,
          comments: initial.comments,
          ate_before_school: initial.ate_before_school,
          feeding_time: initial.feeding_time,
          food: initial.food,
          portion: initial.portion,
          had_medication: initial.had_medication,
          medication_details: initial.medication_details,
          medication_reason: initial.medication_reason,
          special_requests: initial.special_requests,
          pickup_info: initial.pickup_info,
          parent_comments: initial.parent_comments,
        }
      : EMPTY_PARENT_FORM,
  );

  const set = <K extends keyof ParentFormState>(key: K, value: ParentFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const text = (v: string): string | null => (v.trim() === "" ? null : v);

  async function onSave() {
    try {
      await save.mutateAsync({ student_id: studentId, date, ...form });
      toast.success("Daily report saved", {
        description: "Your child's teacher can now see this morning's report.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the report. Please try again.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EnumSelect
          label="Child slept"
          value={form.slept}
          labels={DAILY_SLEEP_LABEL}
          onChange={(v) => set("slept", v)}
        />
        <EnumSelect
          label="Child seems"
          value={form.seems}
          labels={DAILY_CHILD_MOOD_LABEL}
          onChange={(v) => set("seems", v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cdr-comments">Comments</Label>
        <textarea
          id="cdr-comments"
          rows={2}
          className={textareaClass}
          value={form.comments ?? ""}
          onChange={(e) => set("comments", text(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <YesNoSelect
          label="Did the child eat before coming to school?"
          value={form.ate_before_school}
          onChange={(v) => set("ate_before_school", v)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="cdr-feeding-time">Feeding time</Label>
          <Input
            id="cdr-feeding-time"
            type="time"
            value={form.feeding_time ?? ""}
            onChange={(e) => set("feeding_time", text(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdr-food">Food</Label>
          <Input
            id="cdr-food"
            value={form.food ?? ""}
            onChange={(e) => set("food", text(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdr-portion">Portion</Label>
          <Input
            id="cdr-portion"
            value={form.portion ?? ""}
            onChange={(e) => set("portion", text(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <YesNoSelect
          label="Has your child had medication before coming?"
          value={form.had_medication}
          onChange={(v) => set("had_medication", v)}
        />
        {form.had_medication === true && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="cdr-med-details">Names of medicine, amount given and time given</Label>
              <textarea
                id="cdr-med-details"
                rows={2}
                className={textareaClass}
                value={form.medication_details ?? ""}
                onChange={(e) => set("medication_details", text(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cdr-med-reason">Reasons for medicine</Label>
              <textarea
                id="cdr-med-reason"
                rows={2}
                className={textareaClass}
                value={form.medication_reason ?? ""}
                onChange={(e) => set("medication_reason", text(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cdr-requests">Special requests for your child</Label>
        <textarea
          id="cdr-requests"
          rows={2}
          className={textareaClass}
          value={form.special_requests ?? ""}
          onChange={(e) => set("special_requests", text(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cdr-pickup">What time will the child be picked and by who?</Label>
        <Input
          id="cdr-pickup"
          value={form.pickup_info ?? ""}
          onChange={(e) => set("pickup_info", text(e.target.value))}
          placeholder="e.g. 3:30pm · Grandma Adwoa"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cdr-parent-comments">Comments from parent</Label>
        <textarea
          id="cdr-parent-comments"
          rows={2}
          className={textareaClass}
          value={form.parent_comments ?? ""}
          onChange={(e) => set("parent_comments", text(e.target.value))}
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

function EnumSelect<T extends string>({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: T | null;
  labels: Record<T, string>;
  onChange: (v: T | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(v) => onChange(!v || v === NONE ? null : (v as T))}
      >
        <SelectTrigger className="w-full">
          <SelectValue>{(v: string) => (v === NONE ? "—" : (labels[v as T] ?? v))}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {(Object.entries(labels) as [T, string][]).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function YesNoSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const current = value === null ? NONE : value ? "yes" : "no";
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={current}
        onValueChange={(v) => onChange(!v || v === NONE ? null : v === "yes")}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(v: string) => (v === NONE ? "—" : YESNO_LABEL[v as keyof typeof YESNO_LABEL])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
