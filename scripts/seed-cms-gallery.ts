/**
 * Moves the committed gallery photos into Sanity, run once with `pnpm cms:seed:gallery`.
 *
 * why this EXISTS. `getGalleryPhotos()` replaces the gallery as a whole LIST: while Sanity has zero
 * photos the site serves the 13 committed files, and the moment it has one it serves exactly that one.
 * That is the right rule (a half-Sanity, half-local gallery could never have a committed photo removed,
 * and would duplicate any that were re-uploaded) but it makes the first publish a cliff. This script
 * removes the cliff by putting all 13 into Sanity up front, so the handover is invisible on the page.
 *
 * The alt text is the point, not the pixels. Each of these photos already carries a real description
 * written against the actual image ("Nursery classroom with a hand-painted months-and-days tree mural"),
 * and re-typing 13 of those by hand in the Studio is how you end up with "photo1". This carries them
 * across verbatim from `lib/marketing/media.ts`.
 *
 * IDEMPOTENT: documents use a deterministic `_id` derived from the filename and are written with
 * `createOrReplace`, so re-running updates in place instead of duplicating. Re-running after the school
 * has reordered photos WILL reset `position` back to the manifest order; that is the one destructive
 * edge, and it is why the script says so out loud before it writes.
 *
 * The committed files stay in `public/slis/photos/`. They remain the fallback for an unconfigured build
 * (CI, a fresh clone), so deleting them would break `pnpm build` without Sanity credentials.
 */
import { config } from "dotenv";

// Same convention as `scripts/seed-demo.ts`: default to the local env file, overridable for a hosted
// target, so nothing here silently writes to a project you did not mean to touch.
const ENV_FILE = process.env.ENV_FILE ?? ".env.local";
config({ path: ENV_FILE });

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";
import { MEDIA } from "../lib/marketing/media";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  console.error(`NEXT_PUBLIC_SANITY_PROJECT_ID must be set in ${ENV_FILE}.`);
  process.exit(1);
}

if (!token) {
  console.error(
    `SANITY_WRITE_TOKEN must be set in ${ENV_FILE}.\n\n` +
      `Create one at manage.sanity.io -> your project -> API -> Tokens, with "Editor" permission\n` +
      `(NOT "Deploy Studio" — that cannot write content). Then add it to ${ENV_FILE}:\n\n` +
      `  SANITY_WRITE_TOKEN=<the token>\n\n` +
      `It is only needed for this script. Nothing the website does at runtime reads it — published\n` +
      `content is readable without any token, which is what keeps CI credential-free.`,
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2026-08-01", token, useCdn: false });

/** `/slis/photos/campus-courtyard.jpg` -> `gallery-campus-courtyard`, a stable document id. */
function documentIdFor(src: string): string {
  const base = path.basename(src).replace(/\.[^.]+$/, "");
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `gallery-${slug}`;
}

async function main() {
  const photos = MEDIA.gallery;
  console.log(
    `Seeding ${photos.length} gallery photos into Sanity project ${projectId}/${dataset}.\n` +
      `Existing documents with the same ids will be REPLACED (this resets any manual reordering).\n`,
  );

  const existing = await client.fetch<number>('count(*[_type == "galleryImage"])');
  if (existing > 0) {
    console.log(`Note: ${existing} galleryImage document(s) already exist in this dataset.\n`);
  }

  let created = 0;
  for (const [index, photo] of photos.entries()) {
    const filePath = path.join(process.cwd(), "public", photo.src.replace(/^\//, ""));
    const bytes = await readFile(filePath);
    const filename = path.basename(photo.src);

    // Upload the binary first; Sanity dedupes identical files, so a re-run reuses the same asset
    // rather than filling the project with copies.
    const asset = await client.assets.upload("image", bytes, { filename });

    await client.createOrReplace({
      _id: documentIdFor(photo.src),
      _type: "galleryImage",
      image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      // Carried across verbatim; this is the whole reason the script exists.
      alt: photo.alt,
      // Preserve the manifest's deliberate order (the community photo leads).
      position: index + 1,
    });

    created += 1;
    console.log(`  ${String(created).padStart(2)}/${photos.length}  ${filename}`);
  }

  console.log(
    `\nDone. ${created} photos are now in Sanity and /gallery will serve them.\n` +
      `They are published immediately — documents written without a "drafts." id prefix are live.\n` +
      `The files in public/slis/photos/ stay put as the fallback for a build with no Sanity env.`,
  );
}

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
