import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // `studio` and `kiddiewise/` are excluded for COST, not for correctness, both are also public in
  // `lib/auth/access.ts`, which is the authoritative allowlist and the thing that keeps them
  // reachable if this matcher is ever edited. The exclusion matters because the Studio is a
  // single-page app that navigates constantly, and `updateSession` spends a Supabase
  // `auth.getUser()` round-trip on every request it sees. Sanity's own session is the only one that
  // means anything inside /studio, so paying for ours there buys nothing.
  //
  // `kiddiewise/` is the school's static media. It is excluded by PATH rather than by adding `mp4`
  // to the extension list below, because the extension list is what caused a bug: the promo video
  // was absent from it, so the guard ran on the video and redirected anonymous visitors to /login
  // while the poster (a listed `.jpg`) loaded fine. A path rule covers whatever the school adds
  // next, a prospectus PDF, a WebM, a favicon set, without anyone remembering to extend a regex. It
  // also matters for streaming: a browser fetches a video in many byte-range requests, and each one
  // was paying for an auth round-trip.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|studio(?:$|/)|kiddiewise/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
