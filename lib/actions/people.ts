"use server";

import { attempt, orThrow, UserFacingError, type ActionResult } from "./result";

import {
  tenant,
  activeContext,
  assertWrite,
  assertOk,
  assertAdmin,
  provisionUser,
  rollbackProvisionedUser,
  invitePortalUser,
  reissueTempPassword,
  markTempCredential,
  logActivity,
  deleteAuthUser,
  type TenantContext,
  type PortalInvite,
  type IssuedCredentials,
} from "./_server";
import type { TablesUpdate } from "@/lib/supabase/types";
import { z } from "zod";
import { generateTempPassword, tempPasswordExpiry } from "@/lib/temp-password";
import {
  studentCreateSchema,
  studentUpdateSchema,
  parentCreateSchema,
  linkGuardianSchema,
  type StudentCreateInput,
  type StudentUpdateInput,
  type ParentCreateInput,
  type LinkGuardianInput,
} from "@/lib/validators/people";

/** Next admission number: KID-#### from the highest existing numeric suffix. */
async function nextAdmissionNo(ctx: TenantContext): Promise<string> {
  const { data } = await ctx.db.from("students").select("admission_no").like("admission_no", "KID-%");
  const max = (data ?? []).reduce((acc, s) => {
    const m = /^KID-(\d+)$/.exec(s.admission_no);
    return Math.max(acc, m ? Number(m[1]) : 0);
  }, 0);
  return `KID-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Admit a student.
 *
 * A student's class is an `enrollments` row, not a column, so assigning a class here creates the
 * enrollment for the active academic year (05-FLOWS §2). That is what lets a promotion later be a new
 * enrollment rather than an edit that destroys the history.
 *
 * The inline "add new guardian" is validated before the student is inserted, using the same strict
 * schema `createParent` uses. A looser pre-check would let an address through that `createParent` then
 * rejects, after the student row already exists, leaving a half-finished admission.
 */
export async function createStudent(input: StudentCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = studentCreateSchema.parse(input);
    const ctx = await tenant();

    const g = data.new_guardian;
    const newGuardian =
      g && g.first_name && g.last_name && g.email
        ? parentCreateSchema.parse({
            first_name: g.first_name,
            last_name: g.last_name,
            email: g.email,
            phone: g.phone || null,
            occupation: g.occupation || null,
          })
        : null;

    const admission_no = data.admission_no.trim() || (await nextAdmissionNo(ctx));

    const student = assertWrite(
      await ctx.db
        .from("students")
        .insert({
          school_id: ctx.schoolId,
          admission_no,
          first_name: data.first_name,
          last_name: data.last_name,
          other_names: data.other_names,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          blood_group: data.blood_group,
          enrollment_date: data.enrollment_date,
          photo_url: data.photo_url,
          enrollment_status: data.enrollment_status,
          medical_conditions: data.medical_conditions,
          allergies: data.allergies,
          prev_school_name: data.prev_school_name,
          prev_class_ended: data.prev_class_ended,
          prev_average_score: data.prev_average_score,
          prev_year_attended: data.prev_year_attended,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          town: data.town,
          initial_academic_year_id: data.initial_academic_year_id,
          initial_term_id: data.initial_term_id,
        })
        .select("id")
        .single(),
      "student",
      // unique(school_id, admission_no).
      "A student with this admission number already exists.",
    );

    if (data.class_id) {
      const { academicYearId } = await activeContext(ctx);
      if (!academicYearId) {
        throw new UserFacingError("Set an active academic year before assigning a student to a class.");
      }
      assertOk(
        await ctx.db.from("enrollments").insert({
          school_id: ctx.schoolId,
          student_id: student.id,
          class_id: data.class_id,
          academic_year_id: academicYearId,
          status: "active",
        }),
        "enrollment",
      );
    }

    if (newGuardian) {
      // createParent also issues temporary credentials. They aren't surfaced here, the student form has
      // no room to present them, so the admin sends them from the Parents screen via "Send credentials".
      // orThrow on both: these are wrapped actions, so they RETURN their failures. Ignoring either
      // result would save the student with no guardian attached and report success.
      const { profileId: parentId } = orThrow(await createParent(newGuardian));
      orThrow(
        await linkGuardian({
          student_id: student.id,
          parent_profile_id: parentId,
          relationship: g?.relationship ?? "guardian",
          is_primary: true,
        }),
      );
    }

    await logActivity(ctx, "admitted a new student", "student", student.id);

    // `guardian_ids` is validated but not linked here: student_guardians needs a relationship and a
    // primary flag per guardian, which a bare id list can't carry. The UI calls linkGuardian per parent.
    return { id: student.id };
  });
}

export async function updateStudent(input: StudentUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = studentUpdateSchema.parse(input);
    const ctx = await tenant();

    // Only keys actually present are written. Spreading the raw partial would send explicit nulls for
    // untouched fields and wipe them.
    const patch: TablesUpdate<"students"> = {};
    if (data.first_name !== undefined) patch.first_name = data.first_name;
    if (data.last_name !== undefined) patch.last_name = data.last_name;
    if (data.date_of_birth !== undefined) patch.date_of_birth = data.date_of_birth;
    if (data.gender !== undefined) patch.gender = data.gender;
    if (data.admission_no !== undefined) patch.admission_no = data.admission_no;
    if (data.photo_url !== undefined) patch.photo_url = data.photo_url;
    if (data.enrollment_status !== undefined) patch.enrollment_status = data.enrollment_status;

    // These carry `.nullable().default(null)`, so under `.partial()` they never parse to undefined,
    // an omitted key means null, and the edit form submits every registered field.
    patch.other_names = data.other_names;
    patch.blood_group = data.blood_group;
    patch.enrollment_date = data.enrollment_date;
    patch.medical_conditions = data.medical_conditions;
    patch.allergies = data.allergies;
    patch.prev_school_name = data.prev_school_name;
    patch.prev_class_ended = data.prev_class_ended;
    patch.prev_average_score = data.prev_average_score;
    patch.prev_year_attended = data.prev_year_attended;
    patch.email = data.email;
    patch.phone = data.phone;
    patch.address = data.address;
    patch.city = data.city;
    patch.town = data.town;
    patch.initial_academic_year_id = data.initial_academic_year_id;
    patch.initial_term_id = data.initial_term_id;

    const row = assertWrite(
      await ctx.db.from("students").update(patch).eq("id", data.id).select("id").single(),
      "student",
      "A student with this admission number already exists.",
    );

    // A class change is an enrollment change, not a column update. Upserted on the
    // unique(student_id, academic_year_id) constraint so re-assigning within the same year moves the
    // existing enrollment rather than creating a second, competing one.
    if (data.class_id !== undefined && data.class_id !== null) {
      const { academicYearId } = await activeContext(ctx);
      if (!academicYearId) {
        throw new UserFacingError("Set an active academic year before assigning a student to a class.");
      }
      assertOk(
        await ctx.db.from("enrollments").upsert(
          {
            school_id: ctx.schoolId,
            student_id: data.id,
            class_id: data.class_id,
            academic_year_id: academicYearId,
            status: "active",
          },
          { onConflict: "student_id,academic_year_id" },
        ),
        "enrollment",
      );
    }

    return { id: row.id };
  });
}

/**
 * Grant someone portal access, a parent or a staff member.
 *
 * Separate from creating them on purpose (see `provisionUser`): adding a person to the roster is
 * record-keeping, deciding they should be able to log in is a distinct act that happens later, when
 * they ask. `delivery: "link"` returns a URL for the admin to send over WhatsApp; `"email"` posts it
 * to them directly.
 */
export async function invitePortal(input: {
  profile_id: string;
  delivery: "email" | "link";
}): Promise<ActionResult<PortalInvite>> {
  return attempt(async () => {
    const { profile_id, delivery } = z
      .object({ profile_id: z.string().min(1), delivery: z.enum(["email", "link"]) })
      .parse(input);

    const ctx = await tenant();
    return invitePortalUser(ctx, profile_id, delivery);
  });
}

/**
 * Add a parent/guardian. Provisions an auth account because a profile cannot exist without one
 * (`profiles.id` → `auth.users.id`), but notifies nobody, use `invitePortal` for that.
 */
export async function createParent(input: ParentCreateInput): Promise<ActionResult<IssuedCredentials>> {
  return attempt(async () => {
    const data = parentCreateSchema.parse(input);
    const ctx = await tenant();

    // Issued up front so the admin can hand the credentials over while the parent is still at the desk
    // during admission, the whole point of this flow is that it needs no email or SMS provider.
    const tempPassword = generateTempPassword();
    const expiresAt = tempPasswordExpiry(new Date());

    const userId = await provisionUser(ctx, data.email, tempPassword);

    try {
      assertOk(
        await ctx.db.from("profiles").insert({
          id: userId,
          school_id: ctx.schoolId,
          role: "parent",
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          occupation: data.occupation,
          is_active: true,
        }),
        "parent",
      );
      await markTempCredential(userId, expiresAt);
    } catch (err) {
      // Otherwise the orphaned auth account holds the email hostage and the admin can never retry.
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

/**
 * Issue a fresh temporary password so the admin can send credentials again.
 *
 * Named "reissue", not "re-copy", because the original is unrecoverable: passwords are bcrypt hashes.
 * Storing the plaintext to allow a genuine re-copy would expose every parent's password to any admin
 * and to any breach, so the old one is replaced instead.
 */
export async function reissueCredentials(input: {
  profile_id: string;
}): Promise<ActionResult<IssuedCredentials>> {
  return attempt(async () => {
    const { profile_id } = z.object({ profile_id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    return reissueTempPassword(ctx, profile_id);
  });
}

/**
 * Permanently remove a student. Unconditional: the admin decides, after seeing what goes with them
 * (`lib/data/deletion-impact.ts#getStudentDeletionImpact`, rendered in the confirm dialog) — unlike
 * staff, every table keyed on `student_id` is `on delete cascade` (migration 0005 onward), so this
 * genuinely erases their attendance, scores, invoices, payments and terminal reports, not just their
 * name off them. A student who has simply left stays a record: set `enrollment_status` to
 * `withdrawn` or `transferred` through `updateStudent` instead.
 */
export async function deleteStudent(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertAdmin(ctx);

    const { data: target } = await ctx.db.from("students").select("id").eq("id", id).maybeSingle();
    if (!target) throw new UserFacingError("That student is not in your school.");

    assertOk(await ctx.db.from("students").delete().eq("id", id), "student");
    return { ok: true };
  });
}

/**
 * Permanently remove a parent and their auth account. Unconditional, same as `deleteStudent` and
 * `deleteStaff`. `student_guardians` cascades on the parent's profile (migration 0005), so this
 * removes the GUARDIAN LINK, not any linked child, a student stays in the system with one fewer
 * guardian rather than disappearing because their parent's account was deleted.
 */
export async function deleteParent(input: { id: string }): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertAdmin(ctx);

    const { data: target } = await ctx.db
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();
    if (!target) throw new UserFacingError("That parent is not in your school.");
    if (target.role !== "parent") {
      throw new UserFacingError("Only parent accounts can be deleted here.");
    }

    await deleteAuthUser(id); // profile row cascades with the auth account
    return { ok: true };
  });
}

/**
 * Link a parent to a student as a guardian.
 *
 * A student has at most one primary guardian, enforced by the `student_guardians_one_primary` partial
 * unique index (0016). So promoting a new primary must demote the incumbent first, the index would
 * otherwise reject the insert. The mock did this in application code; the invariant now lives in the
 * database, where a concurrent write can't slip past it.
 */
export async function linkGuardian(input: LinkGuardianInput): Promise<ActionResult<{ ok: true }>> {
  return attempt(async () => {
    const data = linkGuardianSchema.parse(input);
    const ctx = await tenant();

    if (data.is_primary) {
      assertOk(
        await ctx.db
          .from("student_guardians")
          .update({ is_primary: false })
          .eq("student_id", data.student_id)
          .eq("is_primary", true),
        "guardian link",
      );
    }

    assertOk(
      await ctx.db.from("student_guardians").upsert(
        {
          school_id: ctx.schoolId,
          student_id: data.student_id,
          parent_profile_id: data.parent_profile_id,
          relationship: data.relationship,
          is_primary: data.is_primary,
        },
        // Re-linking the same pair updates the relationship instead of failing on
        // unique(student_id, parent_profile_id).
        { onConflict: "student_id,parent_profile_id" },
      ),
      "guardian link",
    );

    return { ok: true };
  });
}
