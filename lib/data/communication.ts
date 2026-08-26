import { db, unwrapList } from "./_client";
import type { AnnouncementVM, EventVM } from "@/lib/validators/communication";

/**
 * Announcements and events.
 *
 * One read each, used by all three portals. That is possible because RLS does the filtering:
 * `ann_read` returns only published announcements whose audience matches the reader's role, so an
 * admin sees drafts and everything else, a teacher sees published teacher/everyone rows, and a
 * parent sees published parent/everyone rows, from the same query. Re-filtering by role here would
 * imply the client was the thing enforcing it, and would drift from the policy the moment either
 * changed.
 */

/** Every announcement the caller may see, newest first. */
export async function listAnnouncements(): Promise<AnnouncementVM[]> {
  return unwrapList(
    await db()
      .from("announcements")
      .select("id, title, body, audience, is_published, published_at, created_at")
      // created_at, not published_at: a draft has no published_at, and ordering by it would bury
      // every unpublished row at the bottom of the admin's list where they'd forget about them.
      .order("created_at", { ascending: false }),
    "announcements",
  );
}

/** Every event for the school, soonest first. */
export async function listEvents(): Promise<EventVM[]> {
  return unwrapList(
    await db()
      .from("events")
      .select("id, title, description, start_at, end_at, location")
      .order("start_at", { ascending: true }),
    "events",
  );
}

/**
 * Events still to come, for the dashboard panels.
 *
 * Filtered on the server rather than in the browser so a school with years of history does not ship
 * every past sports day to a parent's phone. `start_at` in the future, an event that started this
 * morning is still today's news, so the boundary is the start of today rather than "now".
 */
export async function listUpcomingEvents(limit = 5): Promise<EventVM[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return unwrapList(
    await db()
      .from("events")
      .select("id, title, description, start_at, end_at, location")
      .gte("start_at", startOfToday.toISOString())
      .order("start_at", { ascending: true })
      .limit(limit),
    "upcoming events",
  );
}
