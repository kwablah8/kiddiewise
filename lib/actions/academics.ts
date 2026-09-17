"use server";

import { attempt, UserFacingError, type ActionResult } from "./result";

import {
  tenant,
  assertWrite,
  assertOk,
  assertAdmin,
  provisionUser,
  rollbackProvisionedUser,
  markTempCredential,
  setSignInBlocked,
  deleteAuthUser,
} from "./_server";
import {
  generateTempPassword,
  tempPasswordExpiry,
  type IssuedCredentials,
} from "@/lib/temp-password";
import {
  academicYearCreateSchema,
  academicYearUpdateSchema,
  termCreateSchema,
  termUpdateSchema,
  classCreateSchema,
  classUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  assignSubjectSchema,
  setReopeningDateSchema,
  type AcademicYearCreateInput,
  type AcademicYearUpdateInput,
  type TermCreateInput,
  type TermUpdateInput,
  type ClassCreateInput,
  type ClassUpdateInput,
  type SubjectCreateInput,
  type StaffCreateInput,
  type AssignSubjectInput,
  type SetReopeningDateInput,
} from "@/lib/validators/academics";
import type { TablesUpdate } from "@/lib/supabase/types";
import { z } from "zod";

// Every write stamps `school_id` from the session, never from the input, see lib/actions/_server.ts.
// Where the database already enforces a rule (unique names, single active year), these functions
// translate the resulting error into something a user can read rather than re-checking it first: a
// pre-flight SELECT would still race, whereas the constraint cannot be beaten.

// ---------------------------------------------------------------------------
// Academic years + terms
// ---------------------------------------------------------------------------

/** New years are created INACTIVE: activating one is a separate, deliberate act. */
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

export async function updateYear(input: AcademicYearUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...patch } = academicYearUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db.from("academic_years").update(patch).eq("id", id).select("id").single(),
      "academic year",
      "An academic year with that name already exists.",
    );
    return { id: row.id };
  });
}

/**
 * Delete a year that was created by mistake.
 *
 * Two guards implement block-if-history (spec 2026-07-31): the active year is refused outright,
 * deleting it would leave every year-scoped read with nothing to scope by, and a year whose terms
 * hold data is refused by the terms' own restrict FKs (attendance, assessments, reports, fees), or
 * by the year's (enrollments, invoices), surfacing here as 23503. Empty terms cascade away with the
 * year, which is what "delete the mistake" means for a year mistyped along with its three terms.
 */
export async function deleteYear(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();

    const { data: year } = await ctx.db
      .from("academic_years")
      .select("is_active")
      .eq("id", id)
      .maybeSingle();
    if (!year) throw new UserFacingError("That academic year no longer exists.");
    if (year.is_active) {
      throw new UserFacingError(
        "This is the active academic year. Set another year active before deleting it.",
      );
    }

    assertOk(
      await ctx.db.from("academic_years").delete().eq("id", id),
      "academic year",
      "This year has enrolments, results or fee records behind it — that history would be lost. Keep the year instead.",
    );
    return { ok: true };
  });
}

export async function updateTerm(input: TermUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id, ...patch } = termUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db.from("terms").update(patch).eq("id", id).select("id").single(),
      "term",
    );
    return { id: row.id };
  });
}

/** Same guards as deleteYear: never the active term, never one with history (restrict FKs → 23503). */
export async function deleteTerm(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();

    const { data: term } = await ctx.db.from("terms").select("is_active").eq("id", id).maybeSingle();
    if (!term) throw new UserFacingError("That term no longer exists.");
    if (term.is_active) {
      throw new UserFacingError("This is the active term. Set another term active before deleting it.");
    }

    // No fee pre-check is needed: fee_items scope terms via the fee_term ENUM (migration 0017),
    // not a term FK, and every remaining dependent (attendance, assessments, reports, invoices)
    // is ON DELETE RESTRICT, history surfaces as 23503 below.
    assertOk(
      await ctx.db.from("terms").delete().eq("id", id),
      "term",
      "This term has attendance, assessments, reports or fee records behind it — that history would be lost. Keep the term instead.",
    );
    return { ok: true };
  });
}

/**
 * Activate a year, deactivating the previous one.
 *
 * `academic_years_one_active` is a partial unique index, so setting a second year active while the
 * first is still active would be rejected outright, the demotion must happen FIRST, and both
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
    // Keep the school's cached active-year pointer in step. activeContext() (which stamps the year on
    // every fee, payment and attendance write) and getActivePeriod() read schools.active_academic_year_id,
    // not academic_years.is_active, so without this, switching the year here left every subsequent write
    // recorded against the old year until a reseed. The active term now belongs to a different year, so
    // clear it; the admin picks the new year's term next.
    assertOk(
      await ctx.db
        .from("schools")
        .update({ active_academic_year_id: id, active_term_id: null })
        .eq("id", ctx.schoolId),
      "school",
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
    // Sync the school's cached active-term pointer, for the same reason as the year above: activeContext()
    // stamps schools.active_term_id (not terms.is_active) onto attendance and other term-scoped writes.
    assertOk(
      await ctx.db.from("schools").update({ active_term_id: id }).eq("id", ctx.schoolId),
      "school",
    );
    return { id: row.id };
  });
}

/**
 * Set (or clear) when school reopens after a term.
 *
 * Lives on the term, not on the reports, so every child in the class is told the same date and the
 * value exists before a batch is generated, see migration 0023. Called from the reopening-date
 * banner on /terminal-reports, which is where the person writing reports is standing.
 */
export async function setReopeningDate(
  input: SetReopeningDateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = setReopeningDateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("terms")
        .update({ reopening_date: data.reopening_date })
        .eq("id", data.term_id)
        .select("id")
        .single(),
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
    // omitted key parses to null rather than undefined; there is no "untouched" state to detect and
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
        .insert({ name: data.name, code: data.code ?? null, is_active: data.is_active, school_id: ctx.schoolId })
        .select("id")
        .single(),
      "subject",
      // Enforced by unique(school_id, name), see the note at the top of this file.
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
    if (data.is_active !== undefined) patch.is_active = data.is_active;

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
 * `staff_no` is assigned here, never accepted from the client; it is an identifier the school owns.
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

/** `staff_no`, `role` and `school_id` are all immutable here, 0015 withholds the grants for the
 *  latter two, and staff numbers are permanent once issued. */
export async function updateStaff(
  input: z.infer<typeof staffUpdateSchema>,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = staffUpdateSchema.parse(input);
    const ctx = await tenant();

    // Deactivating yourself would ban the session you're standing in, the same lockout
    // reissueTempPassword guards against, and equally unrecoverable from inside the app.
    if (data.is_active === false && data.id === ctx.profile.id) {
      throw new UserFacingError("You can't deactivate your own account.");
    }

    // Only the keys the caller actually sent are written: the edit form submits every field, the
    // status toggle submits `{ id, is_active }` alone, and neither may clobber the other's columns
    // (see the note on staffUpdateSchema).
    const patch: TablesUpdate<"profiles"> = {};
    if (data.first_name !== undefined) patch.first_name = data.first_name;
    if (data.last_name !== undefined) patch.last_name = data.last_name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.position !== undefined) patch.position = data.position;
    if (data.department !== undefined) patch.department = data.department;
    if (data.gender !== undefined) patch.gender = data.gender;
    if (data.date_of_birth !== undefined) patch.date_of_birth = data.date_of_birth;
    if (data.hire_date !== undefined) patch.hire_date = data.hire_date;
    if (data.qualification !== undefined) patch.qualification = data.qualification;
    if (data.is_active !== undefined) patch.is_active = data.is_active;

    const row = assertWrite(
      await ctx.db.from("profiles").update(patch).eq("id", data.id).select("id").single(),
      "staff member",
    );

    // The profile update above ran under RLS, so reaching this line proves the caller may manage
    // this person. The ban itself needs the service role; status is a security state, an inactive
    // staff member cannot sign in (spec decision 2).
    if (data.is_active !== undefined) {
      await setSignInBlocked(data.id, !data.is_active);
    }

    return { id: row.id };
  });
}

/**
 * Permanently remove a staff member and their auth account. Unconditional: the admin decides,
 * after seeing what goes with them (`lib/data/deletion-impact.ts#getStaffDeletionImpact`, rendered
 * in the confirm dialog) — every one of those references is `on delete set null`, so a delete
 * strips this person's name off registers, mark sheets and receipts rather than removing that
 * history itself. Deactivation (`updateStaff`'s `is_active`) stays the reversible option for
 * anyone the school would rather keep on record but lock out.
 */
export async function deleteStaff(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertAdmin(ctx);

    if (id === ctx.profile.id) {
      throw new UserFacingError("You can't delete your own account while signed in with it.");
    }

    // Read through the caller's client: RLS confines this to their own school, which is what makes
    // the service-role delete below safe to perform.
    const { data: target } = await ctx.db
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();
    if (!target) throw new UserFacingError("That staff member is not in your school.");
    if (target.role !== "teacher" && target.role !== "school_admin") {
      throw new UserFacingError("Only staff accounts can be deleted here.");
    }

    await deleteAuthUser(id); // profile row cascades with the auth account
    return { ok: true };
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
