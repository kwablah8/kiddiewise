"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Recovery links arrive as `#access_token=…&refresh_token=…&type=recovery`.
 *
 * These tokens MUST be adopted explicitly. The cookie-based SSR client does not consume an implicit
 * -flow fragment on its own, so without this the page would update whichever account is already
 * signed in on the browser — which is a real hijack, not a nuisance: an admin invites a parent from
 * the office computer, the parent opens the link there, and the parent ends up setting the ADMIN's
 * password. Adopting the link's session first makes the page always act on the link's owner.
 */
// "ready"  — arrived via a one-time link (invite / forgot password)
// "forced" — signed in with an admin-issued temporary password and must replace it
type LinkState = "checking" | "ready" | "forced" | "no-token";

export default function UpdatePasswordPage() {
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  useEffect(() => {
    let active = true;

    // One async resolution for every path, so the state is never set synchronously in the effect
    // body (which would cause a cascading re-render).
    async function adoptLinkSession(): Promise<LinkState> {
      const supabase = createClient();
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access_token = fragment.get("access_token");
      const refresh_token = fragment.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) return "no-token";
        // Strip the tokens from the address bar so they don't linger in history or get shared if the
        // user copies the URL.
        window.history.replaceState(null, "", window.location.pathname);
        return "ready";
      }

      // No tokens in the URL. There is exactly ONE case where the existing session may be used: the
      // holder signed in with an admin-issued temporary password and is REQUIRED to replace it. That
      // is safe because they proved knowledge of that credential to get here, and the middleware sent
      // them. Any other session is refused — accepting it is precisely the hijack described above.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "no-token";

      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .maybeSingle();

      return profile?.must_change_password ? "forced" : "no-token";
    }

    adoptLinkSession().then((state) => {
      if (active) setLinkState(state);
    });

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(values: UpdatePasswordInput) {
    setHasError(false);
    const supabase = createClient();

    // Safe now: the effect above bound this client to the session the LINK carried, so updateUser
    // can only ever change that account.
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setErrorMessage(
        error.message.toLowerCase().includes("session")
          ? "This link has expired. Please request a new one."
          : "We couldn't update your password. Please try again.",
      );
      setHasError(true);
      return;
    }

    // Clears must_change_password / temp_password_expires_at and stamps password_changed_at, which is
    // what flips the admin's parents screen from "Awaiting first sign-in" to "Active". Done through an
    // RPC because `authenticated` deliberately has no UPDATE grant on those columns (migration 0020).
    const { error: flagError } = await supabase.rpc("complete_password_change");
    if (flagError) {
      // The password DID change, so failing here must not read as "nothing happened" — say what is
      // true and let them continue.
      setErrorMessage(
        "Your password was changed, but we couldn't finish setting up your account. Please sign in again.",
      );
      setHasError(true);
      return;
    }

    // Sign out so the new password is what gets them back in, rather than leaving a one-time recovery
    // session (or the temporary credential's session) live.
    await supabase.auth.signOut();
    setIsDone(true);
  }

  if (linkState === "checking") {
    return (
      <div className="flex min-h-40 items-center justify-center" role="status" aria-busy="true">
        <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
        <span className="sr-only">Checking your link…</span>
      </div>
    );
  }

  // The form is deliberately unreachable without a valid link — never fall back to the current
  // session, or this page becomes a way to change someone else's password.
  if (linkState === "no-token") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">This link has expired</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Password links can only be used once, and expire after 24 hours. Request a new one and
          we&apos;ll send another.
        </p>
        <Link href="/reset-password" className={cn(buttonVariants(), "mt-6 w-full")}>
          Request a new link
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-full")}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-fg)]">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text)]">Password updated</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link href="/login" className={cn(buttonVariants(), "mt-6 w-full")}>
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text)]">
        {linkState === "forced" ? "Choose your password" : "Set a new password"}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {linkState === "forced"
          ? "You're signed in with a temporary password from the school. Choose your own to continue — only you will know it."
          : "Choose a new password for your account."}
      </p>

      {hasError ? (
        <div className="mt-8">
          {/* Retry restores the form rather than resubmitting: the password fields are cleared on
              error, so there is nothing to resend. An expired link needs a fresh email anyway. */}
          <ErrorState message={errorMessage} onRetry={() => setHasError(false)} />
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)]">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-[var(--danger)]">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
