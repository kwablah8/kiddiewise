import type { StatusTone } from "@/components/data/status-pill";
import type { StudentListItemVM } from "@/lib/validators/people";

/**
 * Tone for each `enrollment_status` value (06-UI §11, status is never color alone, the
 * `StatusPill` always pairs this with the real word). `active` is the only "good" steady
 * state so it gets `success`; `graduated` is a deliberate/positive exit but distinct from
 * "currently enrolled" so it reads as `neutral` rather than competing with `active` for the
 * same green; `withdrawn` is the clearest negative outcome (`danger`); `transferred` and
 * `inactive` are informational, not negative, so `warning`/`neutral` respectively.
 */
const STATUS_TONE: Record<StudentListItemVM["enrollment_status"], StatusTone> = {
  active: "success",
  inactive: "neutral",
  graduated: "neutral",
  withdrawn: "danger",
  transferred: "warning",
};

export function studentStatusTone(status: StudentListItemVM["enrollment_status"]): StatusTone {
  return STATUS_TONE[status];
}
