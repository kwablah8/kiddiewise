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
  it("routes parents to /portal", () => {
    expect(homePathForRole("parent")).toBe("/portal");
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
  it("gives parents no (app) access yet", () => {
    expect(isPathAllowedForRole("parent", "/dashboard")).toBe(false);
    expect(isPathAllowedForRole("parent", "/teacher/dashboard")).toBe(false);
  });
});
