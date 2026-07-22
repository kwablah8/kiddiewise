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
import { cn } from "@/lib/utils";

export default function UpdatePasswordPage() {
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  async function onSubmit() {
    setHasError(false);
    try {
      // SEAM: replace with `supabase.auth.updateUser({ password })`.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsDone(true);
    } catch {
      setHasError(true);
    }
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
          <ErrorState
            message="We couldn't update your password. Please try again."
            onRetry={onSubmit}
          />
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
