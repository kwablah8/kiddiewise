import { describe, expect, it } from "vitest";
import { homePathForRole, isPathAllowedForRole, isPublicPath } from "@/lib/auth/access";

describe("isPublicPath", () => {
  it("treats marketing and auth pages as public", () => {
    for (const p of ["/", "/about", "/admissions", "/news", "/gallery", "/contact"]) {
      expect(isPublicPath(p), p).toBe(true);
    }
    for (const p of ["/login", "/reset-password", "/update-password"]) {
      expect(isPublicPath(p), p).toBe(true);
    }
  });

  it("treats nested marketing content as public", () => {
    expect(isPublicPath("/news/first-term-opens")).toBe(true);
    expect(isPublicPath("/gallery/sports-day")).toBe(true);
  });

  it("treats every portal path as protected", () => {
    for (const p of [
      "/dashboard", "/students", "/students/stu-01", "/staff", "/classes", "/subjects",
      "/enquiries", "/assessments", "/fees", "/grading", "/academic", "/parents",
      "/teacher/dashboard", "/teacher/attendance", "/parent/dashboard", "/parent/children/stu-01",
    ]) {
      expect(isPublicPath(p), p).toBe(false);
    }
  });

  it("lets the embedded Sanity Studio through this app's session guard", () => {
    // "Public" here means our middleware does not gate it — Sanity authenticates it instead. Without
    // this, an unauthenticated editor is bounced to /login and a signed-in teacher is bounced to their
    // own portal by the role check, which sits AFTER this call in lib/supabase/middleware.ts.
    expect(isPublicPath("/studio")).toBe(true);
    // The Studio routes internally into deep, punctuation-heavy paths of its own.
    expect(isPublicPath("/studio/structure/newsPost")).toBe(true);
    expect(isPublicPath("/studio/structure/newsPost;abc123")).toBe(true);
    expect(isPublicPath("/studio/vision")).toBe(true);
  });

  it("lets Sanity's publish webhook through the session guard", () => {
    // Sanity's servers have no session with us; the route verifies an HMAC signature instead. Without
    // this the middleware redirects the POST to /login and publishing stops reaching the site.
    expect(isPublicPath("/api/revalidate-sanity")).toBe(true);
    // Nothing else under /api is opened up by that entry.
    expect(isPublicPath("/api/other")).toBe(false);
  });

  it("does not leak protection via a prefix collision", () => {
    // /newsletter is not /news/…, and /admissions-inbox is not /admissions.
    expect(isPublicPath("/newsletter")).toBe(false);
    expect(isPublicPath("/admissions-inbox")).toBe(false);
    expect(isPublicPath("/studios")).toBe(false);
  });

  it("protects an unknown path by default", () => {
    // A route added later must be protected until it is explicitly listed as public.
    expect(isPublicPath("/promotion")).toBe(false);
    expect(isPublicPath("/terminal-reports")).toBe(false);
  });
});

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
