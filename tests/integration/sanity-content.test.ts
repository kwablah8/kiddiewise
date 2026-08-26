/**
 * Proves the GROQ projections and the Zod contracts still agree.
 *
 * why this EXISTS, SPECIFICALLY. A projection bug shipped that emptied the whole gallery: the shared
 * image projection read `alt` from inside the image object, which is right for a news cover but wrong
 * for a gallery photo, where the description lives on the document. Every row failed validation, the
 * per-row `.catch(null)` turned each failure into a `null`, the list came back empty, and the site
 * "correctly" fell back to the committed photos. Typecheck, lint and 161 unit tests all passed.
 *
 * The unit tests could not have caught it, and it is worth being precise about why: their fixtures are
 * hand-written to satisfy the schema, so the fixture and the schema can never disagree. Only the shape
 * Sanity ACTUALLY returns can contradict the contract. That is what this file feeds in.
 *
 * It deliberately imports the REAL query constants and the REAL schemas. Copying either would recreate
 * exactly the blind spot above.
 *
 * Skips when `NEXT_PUBLIC_SANITY_PROJECT_ID` is unset, so CI and a fresh clone stay green, the same
 * property that makes the whole CMS layer optional.
 */
import { describe, expect, it } from "vitest";
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@sanity/client";

import {
  GALLERY_QUERY,
  NEWS_LIST_QUERY,
  NEWS_SLUGS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/lib/marketing/cms/queries";
import {
  cmsGalleryPhotoSchema,
  cmsNewsSlugsSchema,
  cmsNewsSummarySchema,
  cmsSiteSettingsSchema,
} from "@/lib/validators/marketing";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const describeCms = projectId ? describe : describe.skip;

describeCms("Sanity projections match their contracts", () => {
  // Same configuration the app uses: published perspective, origin (not CDN), no token.
  const client = createClient({
    projectId: projectId!,
    dataset,
    apiVersion: "2026-08-01",
    useCdn: false,
    perspective: "published",
  });

  /**
   * Validates each row INDIVIDUALLY rather than through the tolerant list schema.
   *
   * The list schemas exist to keep one bad row from emptying a page in production, and they do that by
   * swallowing the row's error. Here we want the error. Asserting row-by-row is the difference between
   * "the array parsed" (always true) and "every row is actually usable" (the thing that broke).
   */
  function expectEveryRowValid(
    rows: unknown,
    schema: { safeParse: (value: unknown) => { success: boolean; error?: unknown } },
    label: string,
  ): number {
    expect(Array.isArray(rows), `${label} should return an array`).toBe(true);
    const list = rows as unknown[];
    const failures = list
      .map((row, i) => ({ i, result: schema.safeParse(row) }))
      .filter(({ result }) => !result.success)
      .map(({ i, result }) => `  row ${i}: ${JSON.stringify(result.error)}`);

    expect(
      failures,
      `${label}: ${failures.length}/${list.length} row(s) failed their contract. The projection in ` +
        `lib/marketing/cms/queries.ts and the schema in lib/validators/marketing.ts have drifted:\n` +
        failures.join("\n"),
    ).toEqual([]);
    return list.length;
  }

  it("every gallery photo validates, description included", async () => {
    const rows = await client.fetch<unknown>(GALLERY_QUERY);
    const count = expectEveryRowValid(rows, cmsGalleryPhotoSchema, "gallery");

    if (count === 0) {
      console.warn("[sanity-content] no gallery photos in this dataset — projection unexercised.");
      return;
    }

    // The specific regression: alt must arrive non-empty, from the document rather than the image.
    for (const row of rows as { alt: string; image: { ref: string } }[]) {
      expect(row.alt.length, "gallery alt text must not be empty").toBeGreaterThan(0);
      expect(row.image.ref, "gallery image must carry an asset reference").toMatch(/^image-/);
    }
  });

  it("every news post validates", async () => {
    const rows = await client.fetch<unknown>(NEWS_LIST_QUERY);
    const count = expectEveryRowValid(rows, cmsNewsSummarySchema, "news list");
    if (count === 0) {
      console.warn("[sanity-content] no news posts in this dataset — projection unexercised.");
    }
  });

  it("news slugs validate", async () => {
    const slugs = await client.fetch<unknown>(NEWS_SLUGS_QUERY);
    expect(cmsNewsSlugsSchema.safeParse(slugs).success).toBe(true);
  });

  it("site settings validate, whether or not anyone has filled them in", async () => {
    const raw = await client.fetch<unknown>(SITE_SETTINGS_QUERY);
    // `null` is legitimate, nobody has opened "Site settings" yet, and the merge handles it.
    if (raw === null) return;
    const result = cmsSiteSettingsSchema.safeParse(raw);
    expect(result.success, `siteSettings failed its contract: ${JSON.stringify(result.error)}`).toBe(
      true,
    );
  });

  it("reads published content without a token, which is what keeps CI credential-free", async () => {
    await expect(client.fetch<number>("count(*)")).resolves.toBeTypeOf("number");
  });
});
