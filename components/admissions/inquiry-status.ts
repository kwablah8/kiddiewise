import type { StatusTone } from "@/components/data/status-pill";
import type { InquiryStatus } from "@/lib/validators/inquiries";

// Tone per inquiry status (06-UI §11 — always paired with the real word by StatusPill).
// `new` needs attention (warning); `reviewing` is in-progress (neutral); `accepted`/`converted`
// are positive outcomes (success); `rejected` is the negative outcome (danger).
const STATUS_TONE: Record<InquiryStatus, StatusTone> = {
  new: "warning",
  reviewing: "neutral",
  accepted: "success",
  rejected: "danger",
  converted: "success",
};

export function inquiryStatusTone(status: InquiryStatus): StatusTone {
  return STATUS_TONE[status];
}

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
  converted: "Converted",
};
