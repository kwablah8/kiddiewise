/**
 * The Server Action error contract.
 *
 * These guard a bug that no other suite could see, because it only appeared in a PRODUCTION build:
 * an error thrown out of a Server Action has its message replaced by React's
 * "An error occurred in the Server Components render…" placeholder. Every user-facing message in
 * `lib/actions/*` was therefore invisible to the people using the app, who are school
 * administrators, not developers.
 *
 * The rule these tests hold in place: expected failures are RETURNED and keep their wording;
 * genuine faults are THROWN and are shown as one plain-language sentence.
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  attempt,
  mutate,
  orThrow,
  UNEXPECTED_ERROR_MESSAGE,
  UserFacingError,
  type ActionResult,
} from "@/lib/actions/result";

describe("attempt", () => {
  it("returns the value on success", async () => {
    await expect(attempt(async () => ({ id: "s1" }))).resolves.toEqual({
      ok: true,
      data: { id: "s1" },
    });
  });

  it("returns a UserFacingError's message instead of throwing it", async () => {
    const result = await attempt(async () => {
      throw new UserFacingError("Someone with that email address already has an account.");
    });
    // Returned, not thrown — that is the whole point. A throw would lose this wording in production.
    expect(result).toEqual({
      ok: false,
      message: "Someone with that email address already has an account.",
    });
  });

  it("returns the first Zod issue's message", async () => {
    const schema = z.object({ email: z.string().min(1, "Email is required") });
    const result = await attempt(async () => schema.parse({ email: "" }));
    expect(result).toEqual({ ok: false, message: "Email is required" });
  });

  it("rethrows anything that is not an expected failure", async () => {
    // A fault must stay a throw: that is what keeps its stack and digest in the server logs.
    await expect(
      attempt(async () => {
        throw new Error("null value in column \"school_id\" violates not-null constraint");
      }),
    ).rejects.toThrow("null value in column");
  });

  it("rethrows Next's redirect signal", async () => {
    // `tenant()` -> `requireProfile()` signals "not signed in" by calling redirect(), which THROWS.
    // Swallowing it would turn a redirect to /login into a silent no-op.
    const redirectSignal = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;..." });
    await expect(
      attempt(async () => {
        throw redirectSignal;
      }),
    ).rejects.toBe(redirectSignal);
  });
});

describe("orThrow", () => {
  it("unwraps a success", () => {
    expect(orThrow({ ok: true, data: 42 })).toBe(42);
  });

  it("converts a returned failure back into a throw for the calling action", () => {
    // createStudent creates a guardian via createParent. Without this the student would save with
    // no guardian attached and the admin would be told it worked.
    expect(() => orThrow({ ok: false, message: "That email is taken." })).toThrow(
      "That email is taken.",
    );
  });
});

describe("mutate", () => {
  it("resolves with the action's data", async () => {
    const action = async (n: number): Promise<ActionResult<number>> => ({ ok: true, data: n * 2 });
    await expect(mutate(action)(21)).resolves.toBe(42);
  });

  it("rejects with the returned message, verbatim", async () => {
    const action = async (): Promise<ActionResult<never>> => ({
      ok: false,
      message: "Set an active term before taking attendance.",
    });
    await expect(mutate(action)(undefined)).rejects.toThrow(
      "Set an active term before taking attendance.",
    );
  });

  it("replaces a thrown fault with the plain-language fallback", async () => {
    // In production the rejection arriving here IS React's redaction paragraph. Nothing in it is
    // worth showing a school administrator, so it must never reach the screen.
    const action = async (): Promise<ActionResult<never>> => {
      throw new Error(
        "An error occurred in the Server Components render. The specific message is omitted in production builds…",
      );
    };
    await expect(mutate(action)(undefined)).rejects.toThrow(UNEXPECTED_ERROR_MESSAGE);
  });
});
