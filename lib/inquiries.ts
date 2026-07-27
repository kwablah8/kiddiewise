import type {
  InquiryStatus,
  InquiryVM,
} from "@/lib/validators/inquiries";
import type { ClassOptionVM, StudentCreateInput } from "@/lib/validators/people";

// Inquiry lifecycle (03-DATABASE inquiry_status enum; 05-USER-FLOWS §3):
//   new ─▶ reviewing ─▶ accepted ─▶ converted
//    └────────┴────────▶ rejected ─┐
//                          ▲───────┘ (reconsidered)
// Only `converted` is terminal — once an inquiry has become a student record, undoing it here would
// leave that record orphaned from its origin.
//
// `rejected` is NOT terminal, and that is deliberate. An admissions decision gets reversed all the
// time: a place frees up, a parent supplies the missing document, someone rejects the wrong row in a
// busy list. Making it final meant the only way back was to re-enter the whole application by hand,
// losing the original submission date and everything the parent typed.
//
// This table is the single source of truth for BOTH which action buttons the UI offers AND the
// server-side guard in lib/actions/inquiries.ts, so allowing it here is the entire change.
export const INQUIRY_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  new: ["reviewing", "accepted", "rejected"],
  reviewing: ["accepted", "rejected"],
  accepted: ["converted", "rejected"],
  // Back to reviewing for "we'll look again", or straight to accepted for a decision already made.
  rejected: ["reviewing", "accepted"],
  converted: [],
};

export function canTransitionInquiry(from: InquiryStatus, to: InquiryStatus): boolean {
  return INQUIRY_TRANSITIONS[from].includes(to);
}

export function nextInquiryStatuses(from: InquiryStatus): InquiryStatus[] {
  return INQUIRY_TRANSITIONS[from];
}

// Verb + button styling for each reachable target status — drives the list row's quick-actions
// menu and the detail page's action buttons from one place.
export interface InquiryAction {
  status: InquiryStatus;
  label: string;
  variant: "default" | "outline" | "destructive";
}

const ACTION_META: Record<InquiryStatus, Omit<InquiryAction, "status">> = {
  reviewing: { label: "Mark reviewing", variant: "outline" },
  accepted: { label: "Accept", variant: "default" },
  rejected: { label: "Reject", variant: "destructive" },
  converted: { label: "Convert to student", variant: "default" },
  new: { label: "Reopen", variant: "outline" }, // unreachable per the table; kept for totality.
};

export function inquiryActionsFor(from: InquiryStatus): InquiryAction[] {
  return nextInquiryStatuses(from).map((status) => ({ status, ...ACTION_META[status] }));
}

// --- Convert → student prefill (Convert to student, 05-USER-FLOWS §3) -------------------------

/** Split a single applicant name into first/last on the first space; no space → all first. */
export function splitApplicantName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first_name: trimmed, last_name: "" };
  return { first_name: trimmed.slice(0, idx), last_name: trimmed.slice(idx + 1).trim() };
}

/** Best-effort match of a free-text desired class to a real class option (case/space-insensitive). */
export function matchClassByName(
  desiredClass: string | null,
  options: ClassOptionVM[],
): string | null {
  if (!desiredClass) return null;
  const needle = desiredClass.trim().toLowerCase();
  if (!needle) return null;
  const hit = options.find((o) => o.name.trim().toLowerCase() === needle);
  return hit ? hit.id : null;
}

export interface InquiryParentNote {
  name: string;
  email: string;
  phone: string | null;
}

export interface InquiryPrefill {
  prefill: Partial<StudentCreateInput>;
  parentNote: InquiryParentNote;
}

// Map an inquiry onto the New Student form's create defaults. Parent contact is returned
// separately as a read-only note: the form links EXISTING parent records, but an inquiry's parent
// is free text with no record yet, so creating/linking it stays a manual step via Parents.
export function inquiryToStudentPrefill(
  inquiry: InquiryVM,
  classOptions: ClassOptionVM[],
): InquiryPrefill {
  const { first_name, last_name } = splitApplicantName(inquiry.applicant_name);
  return {
    prefill: {
      first_name,
      last_name,
      class_id: matchClassByName(inquiry.desired_class, classOptions),
    },
    parentNote: {
      name: inquiry.parent_name,
      email: inquiry.parent_email,
      phone: inquiry.parent_phone,
    },
  };
}
