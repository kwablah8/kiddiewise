import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // `studio` is excluded for COST, not for correctness — `/studio` is also listed in
  // `lib/auth/access.ts` PUBLIC_PATHS, which is the authoritative allowlist and the thing that keeps
  // the Studio reachable if this matcher is ever edited. The exclusion matters because the Studio is
  // a single-page app that navigates constantly, and `updateSession` spends a Supabase
  // `auth.getUser()` round-trip on every request it sees. Sanity's own session is the only one that
  // means anything inside /studio, so paying for ours there buys nothing.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|studio(?:$|/)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
