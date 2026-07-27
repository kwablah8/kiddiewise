"use server";

import { attempt, type ActionResult } from "./result";

import {
  tenant,
  assertWrite,
  assertOk,
  provisionUser,
  rollbackProvisionedUser,
  markTempCredential,
} from "./_server";
import {
  generateTempPassword,
  tempPasswordExpiry,
  type IssuedCredentials,
} from "@/lib/temp-password";
import {
  academicYearCreateSchema,
  termCreateSchema,
  classCreateSchema,
  classUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  assignSubjectSchema,
  type AcademicYearCreateInput,
  type TermCreateInput,
  type ClassCreateInput,
  type ClassUpdateInput,
  type SubjectCreateInput,
  type StaffCreateInput,
  type AssignSubjectInput,
} from "@/lib/validators/academics";
import type { TablesUpdate } from "@/lib/supabase/types";
import { z } from "zod";

// Every write stamps `school_id` from the session, never from the input — see lib/actions/_server.ts.
// Where the database already enforces a rule (unique names, single active year), these functions
// translate the resulting error into something a user can read rather than re-checking it first: a
// pre-flight SELECT would still race, whereas the constraint cannot be beaten.

// ---------------------------------------------------------------------------
// Academic years + terms
// ---------------------------------------------------------------------------

/** New years are created INACTIVE — activating one is a separate, deliberate act. */
export async function createYear(input: AcademicYearCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = academicYearCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("academic_years")
        .insert({ ...data, school_id: ctx.schoolId, is_active: false })
        .select("id")
        .single(),
      "academic year",
      "An academic year with that name already exists.",
    );
    return { id: row.id };
  });
}

export async function createTerm(input: TermCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = termCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("terms")
        .insert({ ...data, school_id: ctx.schoolId, is_active: false })
        .select("id")
        .single(),
      "term",
    );
    return { id: row.id };
  });
}

/**
 * Activate a year, deactivating the previous one.
 *
 * `academic_years_one_active` is a partial unique index, so setting a second year active while the
 * first is still active would be rejected outright — the demotion must happen FIRST, and both
 * statements must land. They are issued in order rather than in a transaction because PostgREST has no
 * multi-statement transaction; if the second fails the school is left with no active year, which the
 * UI renders as "no active year" and an admin can immediately correct. That is a recoverable state,
 * unlike two active years, which would silently corrupt every term-scoped read.
 */
export async function setActiveYear(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();

    assertOk(
      await ctx.db.from("academic_years").update({ is_active: false }).eq("is_active", true),
      "academic year",
    );
    const row = assertWrite(
      await ctx.db
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", id)
        .select("id")
        .single(),
      "academic year",
    );
    return { id: row.id };
  });
}

/** Same single-active invariant as years, scoped school-wide (`terms_one_active`). */
export async function setActiveTerm(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();

    assertOk(await ctx.db.from("terms").update({ is_active: false }).eq("is_active", true), "term");
    const row = assertWrite(
      await ctx.db.from("terms").update({ is_active: true }).eq("id", id).select("id").single(),
      "term",
    );
    return { id: row.id };
  });
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export async function createClass(input: ClassCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = classCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("classes")
        .insert({
          name: data.name,
          level: data.level,
          capacity: data.capacity ?? null,
          class_teacher_id: data.class_teacher_id ?? null,
          school_id: ctx.schoolId,
        })
        .select("id")
        .single(),
      "class",
    );
    return { id: row.id };
  });
}

export async function updateClass(input: ClassUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = classUpdateSchema.parse(input);
    const ctx = await tenant();

    // `capacity` and `class_teacher_id` carry `.nullable().default(null)`, so under `.partial()` an
    // omitted key parses to null rather than undefined — there is no "untouched" state to detect and
    // they are always written. That matches how the edit form submits (every registered field).
    const patch: TablesUpdate<"classes"> = {
      capacity: data.capacity,
      class_teacher_id: data.class_teacher_id,
    };
    if (data.name !== undefined) patch.name = data.name;
    if (data.level !== undefined) patch.level = data.level;

    const row = assertWrite(
      await ctx.db.from("classes").update(patch).eq("id", data.id).select("id").single(),
      "class",
    );
    return { id: row.id };
  });
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function createSubject(input: SubjectCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = subjectCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("subjects")
        .insert({ name: data.name, code: data.code ?? null, school_id: ctx.schoolId })
        .select("id")
        .single(),
      "subject",
      // Enforced by unique(school_id, name) — see the note at the top of this file.
      "A subject with this name already exists.",
    );
    return { id: row.id };
  });
}

export async function updateSubject(
  input: z.infer<typeof subjectUpdateSchema>,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = subjectUpdateSchema.parse(input);
    const ctx = await tenant();

    const patch: TablesUpdate<"subjects"> = { code: data.code };
    if (data.name !== undefined) patch.name = data.name;

    const row = assertWrite(
      await ctx.db.from("subjects").update(patch).eq("id", data.id).select("id").single(),
      "subject",
      "A subject with this name already exists.",
    );
    return { id: row.id };
  });
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/** Next staff number for a role: TCH-<n> for teachers, ADM-<n> for administrators. */
async function nextStaffNo(
  ctx: Awaited<ReturnType<typeof tenant>>,
  role: "teacher" | "school_admin",
): Promise<string> {
  const prefix = role === "teacher" ? "TCH" : "ADM";
  const { data } = await ctx.db.from("profiles").select("staff_no").like("staff_no", `${prefix}-%`);

  const max = (data ?? []).reduce((acc, r) => {
    const m = new RegExp(`^${prefix}-(\\d+)$`).exec(r.staff_no ?? "");
    return Math.max(acc, m ? Number(m[1]) : 0);
  }, 0);

  return `${prefix}-${max + 1}`;
}

/**
 * Add a staff member: provision their auth account with a temporary password, then their profile.
 *
 * `staff_no` is assigned here, never accepted from the client — it is an identifier the school owns.
 *
 * Credentials are issued up front, the same way `createParent` does it and for the same reason: the
 * admin is usually sitting with (or on the phone to) the person being added, and handing over a
 * password there and then needs no SMTP account, no working email address, and no second visit. The
 * holder must replace it on first sign-in, so the window in which the admin knows it is short.
 *
 * The two writes span `auth.users` and `profiles` with no shared transaction, so a failed profile
 * insert is compensated by deleting the auth account. Without that, a half-created person would hold
 * the email address hostage and the admin could never retry.
 */
export async function createStaff(input: StaffCreateInput): Promise<ActionResult<IssuedCredentials>> {
  return attempt(async () => {
    const data = staffCreateSchema.parse(input);
    const ctx = await tenant();

    const staff_no = await nextStaffNo(ctx, data.role);
    const tempPassword = generateTempPassword();
    const expiresAt = tempPasswordExpiry(new Date());
    const userId = await provisionUser(ctx, data.email, tempPassword);

    try {
      assertOk(
        await ctx.db.from("profiles").insert({
          id: userId,
          school_id: ctx.schoolId,
          role: data.role,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone ?? null,
          staff_no,
          position: data.position ?? null,
          department: data.department ?? null,
          gender: data.gender ?? null,
          date_of_birth: data.date_of_birth ?? null,
          hire_date: data.hire_date ?? null,
          qualification: data.qualification ?? null,
          is_active: true,
        }),
        "staff member",
      );
      await markTempCredential(userId, expiresAt);
    } catch (err) {
      await rollbackProvisionedUser(userId);
      throw err;
    }

    return {
      profileId: userId,
      personName: `${data.first_name} ${data.last_name}`,
      email: data.email,
      tempPassword,
      expiresAt,
    };
  });
}

/** `staff_no`, `role` and `school_id` are all immutable here — 0015 withholds the grants for the
 *  latter two, and staff numbers are permanent once issued. */
export async function updateStaff(
  input: z.infer<typeof staffUpdateSchema>,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = staffUpdateSchema.parse(input);
    const ctx = await tenant();

    const patch: TablesUpdate<"profiles"> = {
      phone: data.phone,
      position: data.position,
      department: data.department,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      hire_date: data.hire_date,
      qualification: data.qualification,
    };
    if (data.first_name !== undefined) patch.first_name = data.first_name;
    if (data.last_name !== undefined) patch.last_name = data.last_name;
    if (data.email !== undefined) patch.email = data.email;

    const row = assertWrite(
      await ctx.db.from("profiles").update(patch).eq("id", data.id).select("id").single(),
      "staff member",
    );
    return { id: row.id };
  });
}

// ---------------------------------------------------------------------------
// class_subjects assignments
// ---------------------------------------------------------------------------

export async function assignSubject(input: AssignSubjectInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = assignSubjectSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("class_subjects")
        .insert({
          class_id: data.class_id,
          subject_id: data.subject_id,
          teacher_id: data.teacher_id ?? null,
          school_id: ctx.schoolId,
        })
        .select("id")
        .single(),
      "assignment",
      // unique(class_id, subject_id).
      "This subject is already assigned to this class.",
    );
    return { id: row.id };
  });
}

export async function unassign(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertOk(await ctx.db.from("class_subjects").delete().eq("id", id), "assignment");
    return { ok: true };
  });
}
