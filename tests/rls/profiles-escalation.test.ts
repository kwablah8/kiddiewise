import { beforeAll, describe, expect, it } from "vitest";
import { seedTwoSchools, signInAs, type Seeded } from "./helpers";

// Regression test for migration 0015: profiles.role / profiles.school_id are locked to
// service-role-only updates via a column-level grant (a table-level UPDATE grant cannot be
// narrowed by a column REVOKE, so this is the only privilege-layer way to stop the escalation).
// RLS's `profiles_self_update` policy lets a user UPDATE their own row, so without the column
// lock a signed-in user could mint themselves a super_admin or move themselves into another
// school; this proves that hole is closed all the way through PostgREST, not just in theory.

let s: Seeded;
beforeAll(async () => {
  s = await seedTwoSchools();
});

describe("profiles column-level privilege escalation is blocked", () => {
  it("parent CANNOT escalate their own role to super_admin", async () => {
    const c = await signInAs(s.parentAEmail);
    const { error } = await c.from("profiles").update({ role: "super_admin" }).eq("id", s.parentA);
    expect(error).not.toBeNull();
  });

  it("parent CANNOT move their own profile to another school", async () => {
    const c = await signInAs(s.parentAEmail);
    const { error } = await c.from("profiles").update({ school_id: s.schoolB }).eq("id", s.parentA);
    expect(error).not.toBeNull();
  });

  it("(positive control) parent CAN update their own user-editable columns", async () => {
    const c = await signInAs(s.parentAEmail);
    const { error } = await c
      .from("profiles")
      .update({ phone: "+233200000000" })
      .eq("id", s.parentA);
    expect(error).toBeNull();
  });
});
