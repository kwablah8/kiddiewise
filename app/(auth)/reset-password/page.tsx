import Link from "next/link";
import { KeyRound } from "lucide-react";

/**
 * "Forgot password?", deliberately not an email form.
 *
 * The school runs without an email/SMS provider (docs/09 §portal access), so a reset link would
 * simply never arrive; a form promising one is a dead end that reads as a broken product. Instead
 * this mirrors how credentials are issued in the first place: an administrator regenerates a
 * temporary password from the Staff or Parents screen ("Send credentials") and hands it over in
 * person or on WhatsApp, and the holder is forced to choose their own at next sign-in. If an SMTP
 * provider is ever configured, the previous email form is one `git revert` away.
 */
export default function ResetPasswordPage() {
  return (
    <div>
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
        <KeyRound className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-[var(--text)]">Forgot your password?</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Password resets are handled by the school office. Ask your school administrator to issue
        you a <span className="font-medium text-[var(--text)]">new temporary password</span>
        {" — "}the same way you received your first one. You&apos;ll choose your own password the
        next time you sign in.
      </p>
      <ul className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
        <li className="flex gap-2">
          <span className="font-semibold text-[var(--text)]">1.</span>
          Contact the school office and confirm it&apos;s you.
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[var(--text)]">2.</span>
          They&apos;ll send you a fresh temporary password (or a sign-in link) — usually over
          WhatsApp or in person.
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-[var(--text)]">3.</span>
          Sign in with it and set a password of your own.
        </li>
      </ul>
      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        School administrators: issue temporary passwords from the Staff or Parents screen. If you
        are the administrator who is locked out, another administrator can do the same for you.
      </p>
      <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
