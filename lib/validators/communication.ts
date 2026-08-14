import { z } from "zod";

/**
 * Announcements and events — the two things a school pushes out to everyone.
 *
 * They look similar and are deliberately NOT modelled the same way, because the database already
 * treats them differently and pretending otherwise would be a lie the UI has to maintain:
 *
 *   - an announcement is TARGETED and DRAFTABLE. `ann_read` (migration 0010) only returns published
 *     rows whose audience matches the reader's role, so the audience and the publish flag are real
 *     security-relevant fields, enforced in the database rather than in a filter here.
 *   - an event is neither. `ev_select` returns every event to anyone in the school, so an event is
 *     visible the moment it is saved. The form says so out loud rather than implying a draft state
 *     the schema cannot honour.
 */

export const announcementAudience = z.enum(["everyone", "parents", "teachers"]);
export type AnnouncementAudience = z.infer<typeof announcementAudience>;

export const ANNOUNCEMENT_AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  everyone: "Everyone",
  parents: "Parents only",
  teachers: "Teachers only",
};

export const announcementVM = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  audience: announcementAudience,
  is_published: z.boolean(),
  published_at: z.string().nullable(),
  created_at: z.string(),
});
export type AnnouncementVM = z.infer<typeof announcementVM>;

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(1, "Give the announcement a title").max(200, "Keep the title under 200 characters"),
  body: z.string().trim().min(1, "Write what you want people to read").max(10000, "That's longer than an announcement should be"),
  audience: announcementAudience.default("everyone"),
  /** Saving unpublished keeps it a draft — nobody outside the office can see it. */
  is_published: z.boolean().default(false),
});
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

export const announcementUpdateSchema = announcementCreateSchema
  .partial()
  .extend({ id: z.string().min(1) });
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;

export const eventVM = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  start_at: z.string(),
  end_at: z.string().nullable(),
  location: z.string().nullable(),
});
export type EventVM = z.infer<typeof eventVM>;

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Give the event a name").max(200, "Keep the name under 200 characters"),
    description: z.string().trim().max(5000, "That description is too long").nullable().default(null),
    start_at: z.string().min(1, "Choose when it starts"),
    end_at: z.string().nullable().default(null),
    location: z.string().trim().max(200, "Keep the location under 200 characters").nullable().default(null),
  })
  .refine((e) => !e.end_at || e.end_at >= e.start_at, {
    message: "The end has to be after the start",
    path: ["end_at"],
  });
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Give the event a name"),
  description: z.string().nullable().default(null),
  start_at: z.string().min(1, "Choose when it starts"),
  end_at: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
});
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
