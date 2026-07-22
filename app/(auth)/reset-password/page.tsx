"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validators/auth";

export default function ResetPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setHasError(false);
    try {
      // SEAM: replace with `supabase.auth.resetPasswordForEmail(values.email)`.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmittedEmail(values.email);
    } catch {
      setHasError(true);
    }
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-fg)]">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text)]">Check your email</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          If an account exists for <span className="font-medium text-[var(--text)]">{submittedEmail}</span>,
          we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text)]">Reset your password</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Enter the email linked to your account and we&apos;ll send you a reset link.
      </p>

      {hasError ? (
        <div className="mt-8">
          <ErrorState
            message="We couldn't send the reset link. Please try again."
            onRetry={() => onSubmit(getValues())}
          />
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu.gh"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Send reset link
          </Button>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
