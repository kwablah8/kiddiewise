"use client";

import { EmptyState } from "@/components/states/empty-state";
import { NotebookPen } from "lucide-react";
import {
  DAILY_SLEEP_LABEL,
  DAILY_CHILD_MOOD_LABEL,
  DAILY_PORTION_LABEL,
  DAILY_LESSON_MOOD_LABEL,
  DAILY_PLAY_MOOD_LABEL,
  DAILY_ACTIVITY_LABEL,
  type ParentDailySectionVM,
  type TeacherDailySectionVM,
} from "@/lib/validators/daily-reports";

/**
 * Read-only renderings of each half of the daily report, for the OTHER side's screen: the teacher
 * reads the parent's morning section before filling theirs; the parent reads the teacher's section
 * when they pick the child up. Each side edits only its own half, so these are the sole way a
 * section crosses portals.
 */

function yesNo(v: boolean | null): string {
  return v === null ? "—" : v ? "Yes" : "No";
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-[var(--text)]">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export function ParentSectionSummary({ parent }: { parent: ParentDailySectionVM | null }) {
  if (!parent) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No parent report yet"
        description="The parent hasn't filled their section for this day."
      />
    );
  }
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      <Item label="Child slept" value={parent.slept ? DAILY_SLEEP_LABEL[parent.slept] : null} />
      <Item label="Child seems" value={parent.seems ? DAILY_CHILD_MOOD_LABEL[parent.seems] : null} />
      <Item label="Ate before school" value={yesNo(parent.ate_before_school)} />
      <Item label="Feeding time" value={parent.feeding_time} />
      <Item label="Food" value={parent.food} />
      <Item label="Portion" value={parent.portion} />
      <Item label="Medication before coming" value={yesNo(parent.had_medication)} />
      <Item label="Medicine, amount & time" value={parent.medication_details} />
      <Item label="Reason for medicine" value={parent.medication_reason} />
      <Item label="Special requests" value={parent.special_requests} />
      <Item label="Pickup (time & by who)" value={parent.pickup_info} />
      <Item label="Comments" value={parent.comments} />
      <div className="col-span-2 sm:col-span-3">
        <Item label="Comments from parent" value={parent.parent_comments} />
      </div>
    </dl>
  );
}

export function TeacherSectionSummary({ teacher }: { teacher: TeacherDailySectionVM | null }) {
  if (!teacher) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No teacher report yet"
        description="The teacher hasn't filled their section for this day."
      />
    );
  }
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Item label="Time to sleep" value={teacher.nap_start} />
        <Item label="Time awake" value={teacher.nap_wake} />
        <Item
          label="Today's activities"
          value={
            teacher.activities.length > 0
              ? teacher.activities.map((a) => DAILY_ACTIVITY_LABEL[a]).join(", ")
              : null
          }
        />
        <Item label="Breakfast ate" value={teacher.breakfast ? DAILY_PORTION_LABEL[teacher.breakfast] : null} />
        <Item label="Lunch ate" value={teacher.lunch ? DAILY_PORTION_LABEL[teacher.lunch] : null} />
        <Item label="Snack ate" value={teacher.snack ? DAILY_PORTION_LABEL[teacher.snack] : null} />
        <Item label="Medication given" value={teacher.medication_given} />
        <Item
          label="During lessons"
          value={teacher.mood_lessons ? DAILY_LESSON_MOOD_LABEL[teacher.mood_lessons] : null}
        />
        <Item label="At play" value={teacher.mood_play ? DAILY_PLAY_MOOD_LABEL[teacher.mood_play] : null} />
      </dl>

      {teacher.toileting.length > 0 && (
        <div>
          <p className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">
            Diapering / Toileting
          </p>
          <ul className="mt-1.5 space-y-1">
            {teacher.toileting.map((t, i) => (
              <li key={i} className="text-sm text-[var(--text)]">
                {t.time || "—"} · {t.wet ? "Wet" : t.dry ? "Dry" : "—"}
                {t.description ? ` · ${t.description}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Item label="Comments / homework from teacher" value={teacher.teacher_comments} />
    </div>
  );
}
