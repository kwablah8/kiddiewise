"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/client";
import { isTempPasswordExpired } from "@/lib/temp-password";
import { homePathForRole, isPathAllowedForRole } from "@/lib/auth/access";

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setSubmitError(null);
    const supabase = createClient();

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !auth.user) {
      // Deliberately not distinguishing "no such account" from "wrong password" — that difference
      // tells an attacker which emails are registered.
      setSubmitError("That email and password don't match. Please try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, must_change_password, temp_password_expires_at")
      .eq("id", auth.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      setSubmitError(
        "This account isn't set up for a school yet. Please contact your administrator.",
      );
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setSubmitError("This account has been deactivated. Please contact your administrator.");
      return;
    }

    // A temporary password the school issued but nobody used has a deadline. Enforcing it here is
    // what makes the expiry real: until the holder takes ownership, the admin who issued it can reach
    // that child's records, and an unbounded window would leave that open indefinitely.
    if (profile.must_change_password && isTempPasswordExpired(profile.temp_password_expires_at)) {
      await supabase.auth.signOut();
      setSubmitError(
        "This temporary password has expired. Please ask the school office for a new one.",
      );
      return;
    }

    // Still holding a temporary password — the middleware will hold them on /update-password until
    // they replace it, so send them straight there instead of to a portal they can't use yet.
    if (profile.must_change_password) {
      router.replace("/update-password");
      router.refresh();
      return;
    }

    // Honour ?next= from the middleware's redirect, but only when that path is one this role may
    // actually open — otherwise a stale or crafted link would bounce them straight back out.
    //
    // Read from `window.location` rather than `useSearchParams()` on purpose: that hook opts the
    // whole page out of prerendering unless it sits inside a Suspense boundary, and the value is only
    // needed here, inside a submit handler, where `window` is guaranteed to exist.
    const next = new URLSearchParams(window.location.search).get("next");
    const destination =
      next && isPathAllowedForRole(profile.role, next) ? next : homePathForRole(profile.role);

    // refresh() so the server re-renders with the new auth cookie; push() alone can leave the RSC
    // payload cached from the signed-out request.
    router.replace(destination);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--text)]">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sign in to your account.</p>

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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors outline-none hover:text-[var(--text)] focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
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

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--muted-foreground)]">
          {/* <p className="font-medium text-[var(--text)]">Demo accounts — password Password123!</p> */}
          <p className="mt-1">Admin — admin@slis.test</p>
          <p>Teacher — teacher@slis.test</p>
          <p>Parent — parent@slis.test</p>
          <p className="mt-1.5 text-[var(--muted-foreground)]">Seed with `pnpm db:seed`.</p>
        </div>
      )}
    </div>
  );
}
