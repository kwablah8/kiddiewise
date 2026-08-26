import { ZodError } from "zod";

/**
 * The contract between a Server Action and the query hook that calls it.
 *
 * An error thrown out of a Server Action loses its message in production: React's client-side
 * deserializer swaps it for a fixed string (`resolveErrorProd` in
 * react-server-dom-webpack-client.browser.production.js). Every message in `lib/actions/*` used to
 * reach users as "An error occurred in the Server Components render...", which is no use to a school
 * administrator, and it happened for every failure the app can produce: a duplicate parent email, a
 * missing active term, a permission refusal.
 *
 * A returned value is ordinary serialized data and survives. So expected failures come back as
 * `{ ok: false, message }` and only genuine faults are thrown. Throwing therefore means "this is a
 * bug": opaque to the client, loud in the server logs.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

/**
 * Shown when something throws: i.e. when the cause is a fault, not a rule the user broke.
 *
 * Deliberately says nothing technical. The people using this are school administrators and
 * teachers; a stack trace, a Postgres code or a redaction notice tells them nothing they can act on
 * and reads as if the product is broken. It points at the one thing they can usefully do instead.
 */
export const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong at our end. Please try again — if it keeps happening, let the school's IT contact know.";

/**
 * A failure the user is meant to read: a rule they broke, a state they need to fix first.
 *
 * Throwing this from anywhere inside an action is how a message earns its way to the screen,
 * `attempt` converts it to a returned result. Anything else that escapes is treated as a bug.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/**
 * First validation message from a Zod failure.
 *
 * Bare `issue.message` rather than anything prefixed with the field path: every schema in
 * `lib/validators/*` already writes its messages as whole sentences ("Email is required"), and the
 * forms validate against those same schemas client-side, so reaching here at all means a request
 * that bypassed the form. Keeping it plain avoids inventing a second, worse label for a field the
 * user can already see.
 */
function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

/**
 * Run an action body, turning expected failures into returned results.
 *
 * Every exported Server Action wraps its body in this.
 *
 * Note what is not caught: anything that is neither a `UserFacingError` nor a `ZodError` is
 * rethrown untouched. That is load-bearing twice over; it keeps real faults in the Vercel logs
 * with their stack and digest, and it lets Next's own control-flow errors through. `tenant()` calls
 * `requireProfile()`, which signals "not signed in" by calling `redirect()`, and `redirect()` works
 * by throwing. Swallowing that would turn a redirect to /login into a silent no-op.
 */
export async function attempt<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof UserFacingError) return { ok: false, message: error.message };
    if (error instanceof ZodError) return { ok: false, message: zodMessage(error) };
    throw error;
  }
}

/**
 * Consume one action's result from inside another action.
 *
 * `createStudent` can create a guardian along the way, and a wrapped action returns its failure
 * rather than throwing it, so a bare `await createParent(...)` would let "Someone with that email
 * address already has an account" pass by unnoticed and the student would save with no guardian
 * attached. This turns the inner failure back into a throw, which the outer `attempt` then returns
 * as its own result, so the message still reaches the person who pressed the button.
 */
export function orThrow<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new UserFacingError(result.message);
  return result.data;
}

/**
 * Client side of the contract: unwrap a result, or throw an `Error` carrying a readable message.
 *
 * The catch block is the other half of the fix. If the action threw rather than returned, the
 * rejection reaching us here is React's redacted placeholder, whose message is the paragraph this
 * whole module exists to keep off the screen. There is nothing salvageable in it, so it is dropped
 * for the plain-language fallback; the real error is already in the server logs.
 */
async function unwrap<T>(call: Promise<ActionResult<T>>): Promise<T> {
  let result: ActionResult<T>;
  try {
    result = await call;
  } catch {
    throw new Error(UNEXPECTED_ERROR_MESSAGE);
  }
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

/**
 * Adapt a Server Action into a React Query `mutationFn`.
 *
 * Every mutation hook in `lib/queries/*` wraps its action in this, and that is the whole client-side
 * cost of the change: `mutationFn: actions.createParent` becomes
 * `mutationFn: mutate(actions.createParent)`.
 *
 * The point is that nothing downstream moves. The hook still resolves with the action's data and
 * still rejects on failure, so `onSuccess` handlers and every component's
 * `catch (err) { err.message }` keep working untouched; they just receive a sentence written for a
 * school administrator instead of a redaction notice.
 */
export function mutate<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
): (input: TInput) => Promise<TOutput> {
  return (input) => unwrap(action(input));
}
