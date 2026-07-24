import type { StatusTone } from "@/components/data/status-pill";
import type { FeeStatus } from "@/lib/validators/fees";

// Fee status → tone: paid is a positive outcome, partial needs attention, pending is unpaid.
const TONE: Record<FeeStatus, StatusTone> = {
  paid: "success",
  partial: "warning",
  pending: "danger",
};

export function feeStatusTone(status: FeeStatus): StatusTone {
  return TONE[status];
}
