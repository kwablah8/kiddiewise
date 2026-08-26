import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes, SINGLETON_TYPES } from "./sanity/schema";
import { structure } from "./sanity/structure";

/**
 * Sanity Studio configuration, mounted at /studio by `app/studio/[[...tool]]/page.tsx`.
 *
 * This file must sit at the repository root: the Sanity CLI looks for it there, and `basePath` has to
 * agree with the route the Studio is served from or every internal link 404s.
 *
 * `process.env` is read directly rather than through `lib/marketing/cms/env.ts`. That is a deliberate,
 * small duplication: the Sanity CLI loads this file with its own bundler, which does not resolve this
 * repo's `@/*` path alias, so importing app code here would break `sanity` commands. The app side
 * needs the opposite behaviour anyway; it treats a missing project id as "fall back to the committed
 * content" rather than as an error.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "slis",
  title: "SLIS Website",
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Keeps "Site settings" out of the global "create new" menu. Without this an editor can create a
    // second siteSettings document, which the site would silently ignore, the query reads one fixed
    // document id, and that is a confusing afternoon for whoever has to explain why an edit did
    // nothing.
    templates: (templates) =>
      templates.filter(
        ({ schemaType }) => !SINGLETON_TYPES.includes(schemaType as (typeof SINGLETON_TYPES)[number]),
      ),
  },
  document: {
    // Same reason, from the other direction: no duplicating or deleting the singleton.
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.includes(schemaType as (typeof SINGLETON_TYPES)[number])
        ? actions.filter(
            ({ action }) => action && !["unpublish", "delete", "duplicate"].includes(action),
          )
        : actions,
  },
  plugins: [structureTool({ structure }), visionTool()],
});
