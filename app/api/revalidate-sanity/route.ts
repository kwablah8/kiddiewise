import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { tagsFor, type SanityWebhookPayload } from "@/lib/marketing/cms/revalidate";

/**
 * Sanity calls this when the school publishes, so an edit is live on the next request rather than after
 * the time-based backstop in `lib/marketing/cms/read.ts`.
 *
 * `{ expire: 0 }` on `revalidateTag` is the reason this feels instant. The default (`"max"`) is
 * stale-while-revalidate: the next visitor is served the OLD page while a fresh one builds in the
 * background, so an editor who publishes and refreshes still sees their previous content once. Next's
 * docs call out `{ expire: 0 }` specifically for "webhooks or third-party services that need immediate
 * expiration" — the next request blocks for fresh data instead. `updateTag` would be the other route to
 * read-your-own-writes, but it can only be called from a Server Action, never a Route Handler.
 *
 * SECURITY: this endpoint is unauthenticated by necessity (Sanity's servers have no session), so its
 * only protection is the HMAC signature `parseBody` verifies against `SANITY_REVALIDATE_SECRET`. That is
 * why a missing secret is refused below rather than waved through, and why `/api/revalidate-sanity` is
 * allowlisted in `lib/auth/access.ts` — without that, this app's middleware would redirect Sanity's POST
 * to /login and nothing would ever revalidate.
 *
 * It can only ever expire caches. There is no path here that reads or writes school data.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  // `parseBody` SKIPS signature verification when the secret is undefined, which would leave a public
  // endpoint anyone could hammer to force cache misses. Refuse instead of degrading quietly.
  if (!secret) {
    console.error("[revalidate-sanity] SANITY_REVALIDATE_SECRET is not set; refusing the request.");
    return NextResponse.json({ revalidated: false, reason: "not configured" }, { status: 500 });
  }

  try {
    const { isValidSignature, body } = await parseBody<SanityWebhookPayload>(request, secret);

    // `!== true`, NOT `=== false`. `parseBody` returns `isValidSignature: null` — not `false` — when the
    // signature header is absent entirely, so a `=== false` check lets an UNSIGNED request past this
    // gate and leaves it to be caught incidentally by the body check below. Verified: that request was
    // answered 400 "no document type" instead of 401. Nothing exploitable followed from it here, but a
    // security check must state what it permits, not enumerate what it rejects.
    if (isValidSignature !== true) {
      return NextResponse.json({ revalidated: false, reason: "invalid signature" }, { status: 401 });
    }
    if (!body?._type) {
      return NextResponse.json({ revalidated: false, reason: "no document type" }, { status: 400 });
    }

    const tags = tagsFor(body);
    if (tags.length === 0) {
      // A document type we do not render. Answer 200 so Sanity treats it as delivered — a 4xx here
      // would have it retry, and keep retrying, over something we intend to ignore.
      return NextResponse.json({ revalidated: false, reason: `unhandled type ${body._type}` });
    }

    for (const tag of tags) revalidateTag(tag, { expire: 0 });

    return NextResponse.json({ revalidated: true, tags });
  } catch (error) {
    console.error("[revalidate-sanity] failed:", error);
    return NextResponse.json({ revalidated: false, reason: "error" }, { status: 500 });
  }
}
