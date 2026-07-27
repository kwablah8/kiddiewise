"use server";

import { attempt, type ActionResult } from "./result";

import { tenant, assertWrite, assertOk } from "./_server";
import {
  announcementCreateSchema,
  announcementUpdateSchema,
  eventCreateSchema,
  eventUpdateSchema,
  type AnnouncementCreateInput,
  type AnnouncementUpdateInput,
  type EventCreateInput,
  type EventUpdateInput,
} from "@/lib/validators/communication";
import { z } from "zod";

/**
 * Announcement and event writes.
 *
 * Only admins reach these — `ann_admin` and `ev_admin` (migration 0010) are the enforcement, and
 * they check the role in the database rather than trusting anything sent from the browser.
 */

/**
 * `published_at` is stamped by the server, never sent by the client, and only on the transition
 * INTO published. Re-saving an already-published announcement must not silently move it to the top
 * of every parent's list — the school published it once, and that is when it happened.
 */
function publishedStamp(isPublished: boolean | undefined, wasPublished: boolean) {
  if (isPublished === undefined) return {};
  if (isPublished && !wasPublished) return { published_at: new Date().toISOString() };
  // Unpublishing clears the stamp, so re-publishing later reads as a fresh announcement rather
  // than one that has apparently been live since a date nobody remembers.
  if (!isPublished) return { published_at: null };
  return {};
}

export async function createAnnouncement(
  input: AnnouncementCreateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = announcementCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("announcements")
        .insert({
          school_id: ctx.schoolId,
          title: data.title,
          body: data.body,
          audience: data.audience,
          is_published: data.is_published,
          published_at: data.is_published ? new Date().toISOString() : null,
          created_by: ctx.profile.id,
        })
        .select("id")
        .single(),
      "announcement",
    );
    return { id: row.id };
  });
}

export async function updateAnnouncement(
  input: AnnouncementUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = announcementUpdateSchema.parse(input);
    const ctx = await tenant();

    // Read the current publish state first: the stamp depends on whether this is a transition, and
    // that cannot be worked out from the incoming patch alone.
    const { data: current } = await ctx.db
      .from("announcements")
      .select("is_published")
      .eq("id", data.id)
      .maybeSingle();

    const row = assertWrite(
      await ctx.db
        .from("announcements")
        .update({
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.body !== undefined ? { body: data.body } : {}),
          ...(data.audience !== undefined ? { audience: data.audience } : {}),
          ...(data.is_published !== undefined ? { is_published: data.is_published } : {}),
          ...publishedStamp(data.is_published, current?.is_published ?? false),
        })
        .eq("id", data.id)
        .select("id")
        .single(),
      "announcement",
    );
    return { id: row.id };
  });
}

export async function deleteAnnouncement(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertOk(await ctx.db.from("announcements").delete().eq("id", id), "announcement");
    return { id };
  });
}

export async function createEvent(input: EventCreateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = eventCreateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("events")
        .insert({
          school_id: ctx.schoolId,
          title: data.title,
          description: data.description,
          start_at: data.start_at,
          end_at: data.end_at,
          location: data.location,
          created_by: ctx.profile.id,
        })
        .select("id")
        .single(),
      "event",
    );
    return { id: row.id };
  });
}

export async function updateEvent(input: EventUpdateInput): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const data = eventUpdateSchema.parse(input);
    const ctx = await tenant();

    const row = assertWrite(
      await ctx.db
        .from("events")
        .update({
          title: data.title,
          description: data.description,
          start_at: data.start_at,
          end_at: data.end_at,
          location: data.location,
        })
        .eq("id", data.id)
        .select("id")
        .single(),
      "event",
    );
    return { id: row.id };
  });
}

export async function deleteEvent(input: { id: string }): Promise<ActionResult<{ id: string }>> {
  return attempt(async () => {
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const ctx = await tenant();
    assertOk(await ctx.db.from("events").delete().eq("id", id), "event");
    return { id };
  });
}
