import { defineCliConfig } from "sanity/cli";

/**
 * Configuration for the `sanity` CLI (`pnpm dlx sanity manage`, dataset exports, and so on).
 *
 * The Studio itself is built by Next.js as part of `pnpm build`, not by the Sanity CLI; this file
 * exists so CLI commands that need to know which project they are pointed at can find out. Same
 * direct `process.env` read as `sanity.config.ts`, for the same reason: the CLI's bundler does not
 * resolve this repo's `@/*` alias.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
