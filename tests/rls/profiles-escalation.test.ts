import { beforeAll, describe, expect, it } from "vitest";
import { admin, seedTwoSchools, signInAs, type Seeded } from "./helpers";

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

// `is_active` is a security state, not a display flag: an inactive staff member cannot sign in, and
// several server actions gate on it. It sits in the same column grant as the genuinely user-editable
// fields, so `profiles_self_update` let ANY signed-in user flip their own. The window is real: a
// deactivated user's access token stays valid until it expires, and within it they could restore the
// flag and appear active again to every screen that reads it. Only a school admin, and never on
// their own row, may change it.

describe("is_active cannot be set by the account it belongs to", () => {
  /** Put the row into a known state without going through the guard. */
  const setActive = (id: string, value: boolean) =>
    admin().from("profiles").update({ is_active: value }).eq("id", id);
  const isActive = async (id: string) =>
    (await admin().from("profiles").select("is_active").eq("id", id).single()).data!.is_active;

  it("teacher CANNOT reactivate their own deactivated account", async () => {
    // The real attack. Banning an auth user does not revoke an access token already issued, so a
    // just-deactivated staff member holds a working token until it expires. Signing in BEFORE the
    // deactivation is what models that window.
    const c = await signInAs(s.teacherAEmail);
    await setActive(s.teacherA, false);

    const { error } = await c.from("profiles").update({ is_active: true }).eq("id", s.teacherA);

    expect(error).not.toBeNull();
    expect(await isActive(s.teacherA)).toBe(false);
  });

  it("teacher CANNOT deactivate themselves", async () => {
    await setActive(s.teacherA, true);
    const c = await signInAs(s.teacherAEmail);

    const { error } = await c.from("profiles").update({ is_active: false }).eq("id", s.teacherA);

    expect(error).not.toBeNull();
    expect(await isActive(s.teacherA)).toBe(true);
  });

  it("parent CANNOT change their own is_active", async () => {
    await setActive(s.parentA, true);
    const c = await signInAs(s.parentAEmail);

    const { error } = await c.from("profiles").update({ is_active: false }).eq("id", s.parentA);

    expect(error).not.toBeNull();
    expect(await isActive(s.parentA)).toBe(true);
  });

  it("admin CANNOT reactivate their own deactivated account", async () => {
    // Being an admin does not help: the rule is about the row being your own. `updateStaff` already
    // refuses self-deactivation in application code; this is the same rule in the database, and it
    // also covers the direction application code never considered.
    const c = await signInAs(s.adminAEmail);
    await setActive(s.adminA, false);

    const { error } = await c.from("profiles").update({ is_active: true }).eq("id", s.adminA);

    expect(error).not.toBeNull();
    expect(await isActive(s.adminA)).toBe(false);
    await setActive(s.adminA, true);
  });

  it("(positive control) admin CAN deactivate a staff member in their school", async () => {
    // The production feature: this is what the Staff screen's status toggle does. If it ever fails,
    // the guard above has broken staff deactivation.
    await setActive(s.teacherA, true);
    const c = await signInAs(s.adminAEmail);

    const { error } = await c.from("profiles").update({ is_active: false }).eq("id", s.teacherA);

    expect(error).toBeNull();
    expect(await isActive(s.teacherA)).toBe(false);
  });

  it("(positive control) admin CAN reactivate a staff member again", async () => {
    const c = await signInAs(s.adminAEmail);
    const { error } = await c.from("profiles").update({ is_active: true }).eq("id", s.teacherA);
    expect(error).toBeNull();
    expect(await isActive(s.teacherA)).toBe(true);
  });

  it("(positive control) the service role can still set is_active, for provisioning and seeds", async () => {
    const { error } = await setActive(s.teacherA, true);
    expect(error).toBeNull();
  });

  it("(positive control) a user's other editable columns are unaffected", async () => {
    const c = await signInAs(s.teacherAEmail);
    const { error } = await c.from("profiles").update({ phone: "+233200000111" }).eq("id", s.teacherA);
    expect(error).toBeNull();
  });
});
