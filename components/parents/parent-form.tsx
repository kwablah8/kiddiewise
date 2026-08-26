"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppRouter } from "@/lib/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateParent } from "@/lib/queries/people";
import { CredentialsDialog } from "@/components/people/credentials-dialog";
import type { IssuedCredentials } from "@/lib/temp-password";
import { parentCreateSchema, type ParentCreateInput } from "@/lib/validators/people";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

// `parentCreateSchema` has `.default(null)` on `occupation`, so its input type (what the form
// collects) differs from its output type (what create requires), same pattern as
// `student-form.tsx` / `staff-form.tsx`.
type ParentFormInput = z.input<typeof parentCreateSchema>;

/** Create-parent form (06-UI §6 "Forms"). */
export function ParentForm() {
  const router = useAppRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const createParent = useCreateParent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParentFormInput, unknown, ParentCreateInput>({
    resolver: zodResolver(parentCreateSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "" },
  });

  async function onSubmit(values: ParentCreateInput) {
    setSubmitError(null);
    try {
      // The action creates the auth account with a generated temporary password and returns it. This
      // is the only moment it can be displayed; it is stored hashed, so it cannot be shown again.
      const phone = values.phone && values.phone.trim() !== "" ? values.phone.trim() : null;
      const credentials = await createParent.mutateAsync({ ...values, phone });
      setIssued(credentials);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      {/* Navigation is deferred until the admin closes this: leaving the page is what destroys the
          only copy of the temporary password. */}
      <CredentialsDialog
        credentials={issued}
        onClose={() => {
          setIssued(null);
          router.push("/parents");
        }}
      />
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn(cardShellClass, "space-y-6")}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" aria-invalid={!!errors.first_name} {...register("first_name")} />
          {errors.first_name && (
            <p className="text-xs text-[var(--danger)]">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" aria-invalid={!!errors.last_name} {...register("last_name")} />
          {errors.last_name && (
            <p className="text-xs text-[var(--danger)]">{errors.last_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="parent@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+233 24 555 0110"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && <p className="text-xs text-[var(--danger)]">{errors.phone.message}</p>}
        </div>
      </div>

      {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-6">
        <Link href="/parents" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Add Parent
        </Button>
      </div>
    </form>
    </>
  );
}
