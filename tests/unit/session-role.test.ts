import { describe, expect, it } from "vitest";
import { mockRoleForEmail, profileForMockRole, mockTeacherProfile } from "@/lib/auth/session";

describe("mockRoleForEmail", () => {
  it("maps the seeded teacher email to teacher", () => {
    expect(mockRoleForEmail("efua.owusu@school.edu.gh")).toBe("teacher");
    expect(mockRoleForEmail("  Efua.Owusu@School.edu.gh ")).toBe("teacher"); // trim + case-insensitive
  });
  it("maps the seeded parent email to parent", () => {
    expect(mockRoleForEmail("yaw.mensah@example.com")).toBe("parent");
  });
  it("defaults every other email to school_admin", () => {
    expect(mockRoleForEmail("ama.mensah@greenfield.edu.gh")).toBe("school_admin");
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
