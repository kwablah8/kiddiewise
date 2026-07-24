import { describe, expect, it } from "vitest";
import { homePathForRole, isPathAllowedForRole } from "@/lib/auth/access";

describe("homePathForRole", () => {
  it("routes admins to /dashboard", () => {
    expect(homePathForRole("school_admin")).toBe("/dashboard");
    expect(homePathForRole("super_admin")).toBe("/dashboard");
  });
  it("routes teachers to /teacher/dashboard", () => {
    expect(homePathForRole("teacher")).toBe("/teacher/dashboard");
  });
  it("routes parents to /parent/dashboard", () => {
    expect(homePathForRole("parent")).toBe("/parent/dashboard");
  });
});

describe("isPathAllowedForRole", () => {
  it("lets teachers into the teacher subtree only", () => {
    expect(isPathAllowedForRole("teacher", "/teacher/dashboard")).toBe(true);
    expect(isPathAllowedForRole("teacher", "/teacher")).toBe(true);
    expect(isPathAllowedForRole("teacher", "/dashboard")).toBe(false);
    expect(isPathAllowedForRole("teacher", "/students")).toBe(false);
  });
  it("keeps admins out of the teacher subtree but everywhere else in", () => {
    expect(isPathAllowedForRole("school_admin", "/teacher/dashboard")).toBe(false);
    expect(isPathAllowedForRole("school_admin", "/dashboard")).toBe(true);
    expect(isPathAllowedForRole("super_admin", "/grading")).toBe(true);
  });
  it("does not treat /teachers as the /teacher subtree", () => {
    expect(isPathAllowedForRole("school_admin", "/teachers")).toBe(true);
    expect(isPathAllowedForRole("teacher", "/teachers")).toBe(false);
  });
  it("lets parents into the parent subtree only", () => {
    expect(isPathAllowedForRole("parent", "/parent/dashboard")).toBe(true);
    expect(isPathAllowedForRole("parent", "/parent")).toBe(true);
    expect(isPathAllowedForRole("parent", "/parent/children/stu-01")).toBe(true);
    expect(isPathAllowedForRole("parent", "/dashboard")).toBe(false);
    expect(isPathAllowedForRole("parent", "/teacher/dashboard")).toBe(false);
  });
  it("keeps admins and teachers out of the parent subtree", () => {
    expect(isPathAllowedForRole("school_admin", "/parent/dashboard")).toBe(false);
    expect(isPathAllowedForRole("super_admin", "/parent/children/stu-01")).toBe(false);
    expect(isPathAllowedForRole("teacher", "/parent/dashboard")).toBe(false);
  });
  it("does not treat /parents as the /parent subtree", () => {
    expect(isPathAllowedForRole("school_admin", "/parents")).toBe(true);
    expect(isPathAllowedForRole("parent", "/parents")).toBe(false);
  });
});
