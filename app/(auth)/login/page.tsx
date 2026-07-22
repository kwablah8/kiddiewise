"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { setMockSessionActive } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit() {
    setSubmitError(null);
    try {
      // SEAM: replace with `supabase.auth.signInWithPassword({ email, password })`.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMockSessionActive();
      router.push("/dashboard");
    } catch {
      setSubmitError("We couldn't sign you in. Please try again.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text)]">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sign in to your admin account.</p>

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
          {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-[var(--danger)]">{errors.password.message}</p>
          )}
        </div>

        {submitError && <p className="text-xs text-[var(--danger)]">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
