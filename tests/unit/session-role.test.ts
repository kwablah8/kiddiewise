import { describe, expect, it } from "vitest";
import {
  mockRoleForEmail,
  profileForMockRole,
  mockTeacherProfile,
  mockParentProfile,
} from "@/lib/auth/session";

// Reference the profile-email constants (not hardcoded strings) so these stay correct if the demo
// emails change.
describe("mockRoleForEmail", () => {
  it("maps the seeded teacher email to teacher (trim + case-insensitive)", () => {
    expect(mockRoleForEmail(mockTeacherProfile.email)).toBe("teacher");
    expect(mockRoleForEmail(`  ${mockTeacherProfile.email.toUpperCase()} `)).toBe("teacher");
  });
  it("maps the seeded parent email to parent", () => {
    expect(mockRoleForEmail(mockParentProfile.email)).toBe("parent");
  });
  it("defaults every other email to school_admin", () => {
    expect(mockRoleForEmail("nobody@example.com")).toBe("school_admin");
  });
});

describe("profileForMockRole", () => {
  it("returns the teacher profile linked to the stf-01 fixture", () => {
    const p = profileForMockRole("teacher");
    expect(p.role).toBe("teacher");
    expect(p.id).toBe("stf-01"); // so class_subjects.teacher_id resolves
    expect(p).toBe(mockTeacherProfile);
  });
  it("returns the parent profile linked to the prt-01 guardian fixtures", () => {
    const p = profileForMockRole("parent");
    expect(p.role).toBe("parent");
    expect(p.id).toBe("prt-01"); // so student_guardians links resolve
  });
});
