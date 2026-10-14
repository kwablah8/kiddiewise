import type { StaffRole } from "@/lib/validators/academics";

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  teacher: "Teacher",
  school_admin: "Administrator",
  non_teaching: "Non-teaching",
};

/** The prefix of the staff number issued to each role. */
export const STAFF_NO_PREFIX: Record<StaffRole, string> = {
  teacher: "TCH",
  school_admin: "ADM",
  non_teaching: "NTS",
};

/** Non-teaching staff are a record and a gate number only: they have no portal to sign in to. */
export const hasPortal = (role: StaffRole): boolean => role !== "non_teaching";
