"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/**
 * The client boundary the Studio needs, and it is a requirement, not a preference.
 *
 * `sanity.config.ts` imports from the `sanity` package, which reaches `swr`. In a React Server
 * Component graph Node resolves `swr` through its `react-server` export condition, and that build has
 * no default export, so `import useSWR from "swr"` inside Sanity's own code fails the build with
 * "Export default doesn't exist in target module". Nothing about the Studio wants to be a Server
 * Component anyway; it is a single-page app that talks to Sanity's API from the browser, so the
 * config is imported here, behind `"use client"`, and the RSC graph never sees the `sanity` package.
 *
 * Keeping the sibling `page.tsx` a Server Component is what lets it export `metadata`/`viewport`,
 * which Next forbids in a client module.
 */
export function StudioClient() {
  return <NextStudio config={config} />;
}
