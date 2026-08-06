import type { ReactNode } from "react";

/**
 * The Studio gets its own layout segment that renders `children` and nothing else.
 *
 * It sits outside `(marketing)` and `(app)`, so it inherits neither site chrome. It still inherits the
 * root `app/layout.tsx` — which is what we want for `<html>`/`<body>` — but the Studio ships its own
 * full-viewport UI and must not be wrapped in anything that adds padding, a flex column, or a nav.
 *
 * `min-h-screen` is here because the root body is `min-h-full flex flex-col`; without a child that
 * claims height, the Studio collapses to a few pixels.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
