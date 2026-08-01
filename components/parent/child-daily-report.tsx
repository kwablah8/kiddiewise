"use client";

import { useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { toast } from "@/lib/toast";
import { ChildTabs } from "@/components/parent/child-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { TeacherSectionSummary } from "@/components/daily-reports/section-views";
import { ChoicePills, YesNoPills } from "@/components/daily-reports/choice-pills";
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

/**
 * The parent's side of the daily report: fill the morning section, read the teacher's back.
 *
 * The form follows the paper original's rhythm — sleep & mood, breakfast, medication, then the
 * handover notes — as titled sections rather than one flat stack, with the follow-up fields
 * (what was eaten, which medicine) revealed only once their yes/no is answered. Enum questions
 * are one-tap pills, not dropdowns: this gets filled at the school gate with a child on one arm.
 */
export function ChildDailyReport({ id }: { id: string }) {
  const [date, setDate] = useState<string>(todayISO());
  const { data, isLoading, isError, refetch } = useDailyReport(id, date);

  return (
    <div className="space-y-6">
      <ChildTabs childId={id} />

      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <p className="text-xs text-[var(--muted-foreground)]">
          One report per school day — pick a date to look back.
        </p>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">
                  Your report about your child
                </h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Fill this in before or at drop-off — the class teacher reads it during the day.
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <NotebookPen className="size-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5">
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

/** A titled slice of the form, with the same label treatment as the detail pages. */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-[var(--border)] pt-4">
      <legend className="pr-3 text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">
        {title}
      </legend>
      <div className="mt-3 space-y-4">{children}</div>
    </fieldset>
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

// Controlled state, not RHF — every field is nullable and the controls' structure is the
// validation; the Zod contract runs in the action.
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
    <div className="space-y-6">
      <FormSection title="Sleep & mood">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Child slept</Label>
            <ChoicePills
              ariaLabel="Child slept"
              value={form.slept}
              onChange={(v) => set("slept", v)}
              options={(Object.entries(DAILY_SLEEP_LABEL) as [NonNullable<ParentFormState["slept"]>, string][]).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Child seems</Label>
            <ChoicePills
              ariaLabel="Child seems"
              value={form.seems}
              onChange={(v) => set("seems", v)}
              options={(Object.entries(DAILY_CHILD_MOOD_LABEL) as [NonNullable<ParentFormState["seems"]>, string][]).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdr-comments">Comments</Label>
          <textarea
            id="cdr-comments"
            rows={2}
            placeholder="Anything about last night or this morning"
            className={textareaClass}
            value={form.comments ?? ""}
            onChange={(e) => set("comments", text(e.target.value))}
          />
        </div>
      </FormSection>

      <FormSection title="Breakfast">
        <div className="space-y-2">
          <Label>Did the child eat before coming to school?</Label>
          <YesNoPills
            ariaLabel="Did the child eat before coming to school?"
            value={form.ate_before_school}
            onChange={(v) => set("ate_before_school", v)}
          />
        </div>
        {form.ate_before_school === true && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                placeholder="e.g. Tea and bread"
                value={form.food ?? ""}
                onChange={(e) => set("food", text(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cdr-portion">Portion</Label>
              <Input
                id="cdr-portion"
                placeholder="e.g. All of it"
                value={form.portion ?? ""}
                onChange={(e) => set("portion", text(e.target.value))}
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Medication">
        <div className="space-y-2">
          <Label>Has your child had medication before coming?</Label>
          <YesNoPills
            ariaLabel="Has your child had medication before coming?"
            value={form.had_medication}
            onChange={(v) => set("had_medication", v)}
          />
        </div>
        {form.had_medication === true && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="cdr-med-details">Names of medicine, amount given and time given</Label>
              <textarea
                id="cdr-med-details"
                rows={2}
                placeholder="e.g. Paracetamol syrup · 5ml · 6:30am"
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
      </FormSection>

      <FormSection title="Pickup & notes for the teacher">
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
          <Label htmlFor="cdr-requests">Special requests for your child</Label>
          <textarea
            id="cdr-requests"
            rows={2}
            placeholder="e.g. Please keep her jacket on outside"
            className={textareaClass}
            value={form.special_requests ?? ""}
            onChange={(e) => set("special_requests", text(e.target.value))}
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
      </FormSection>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          You can come back and update this through the day.
        </p>
        <Button type="button" onClick={onSave} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save Report
        </Button>
      </div>
    </div>
  );
}
