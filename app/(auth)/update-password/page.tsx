"use client";

import { useState } from "react";
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

export default function UpdatePasswordPage() {
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  async function onSubmit(values: UpdatePasswordInput) {
    setHasError(false);
    const supabase = createClient();

    // The recovery link in the email establishes a session before landing here, so updateUser
    // knows which account to change — there is no token to pass explicitly.
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setErrorMessage(
        error.message.toLowerCase().includes("session")
          ? "This reset link has expired. Please request a new one."
          : "We couldn't update your password. Please try again.",
      );
      setHasError(true);
      return;
    }

    // Sign out so the new password is actually used to get back in, rather than leaving the
    // recovery session live.
    await supabase.auth.signOut();
    setIsDone(true);
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
      <h1 className="text-2xl font-semibold text-[var(--text)]">Set a new password</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Choose a new password for your account.
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
