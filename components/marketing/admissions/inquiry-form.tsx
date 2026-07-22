"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useSubmitInquiry } from "@/lib/queries/inquiries";
import { inquiryCreateSchema, type InquiryCreateInput } from "@/lib/validators/inquiries";
import { cn } from "@/lib/utils";

// desired_class is free text on admissions_inquiries (03-DATABASE §8), not a FK to `classes` —
// the marketing site is public and unauthenticated, so it offers this fixed stage list rather
// than querying the school's real (tenant-scoped) class roster.
const DESIRED_CLASSES = [
  "Crèche",
  "KG 1",
  "KG 2",
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
  "Basic 6",
  "JHS 1",
  "JHS 2",
  "JHS 3",
] as const;

const fieldClass = cn(
  "mt-1.5 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3",
  "text-[15px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]",
  "focus-visible:border-[var(--m-brand)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)]/25",
  "aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--danger)]/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
);
const labelClass = "block text-sm font-medium text-[var(--text)]";
const optionalHint = "font-normal text-[var(--muted-foreground)]";
const errorClass = "mt-1.5 text-sm text-[var(--danger)]";

/** `""` -> `null` so an empty optional field matches the nullable Zod schema, not an empty string. */
function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

interface InquiryFormProps {
  /** Copy for the submit button and the success card — lets Admissions/Contact each sound distinct. */
  submitLabel?: string;
  successHeading?: string;
  successBody?: string;
  className?: string;
}

/**
 * The one inquiry form behind both Admissions and Contact (docs/05-USER-FLOWS §10). RHF + Zod
 * (`inquiryCreateSchema`), submitted through `useSubmitInquiry()` — never the action or store
 * directly. Four states: editable (with inline errors on invalid submit, input preserved —
 * RHF's default since `reset()` is only called after a real success), submitting
 * (disabled + spinner), and an inline success card.
 */
export function InquiryForm({
  submitLabel = "Submit inquiry",
  successHeading = "Thanks — we'll be in touch.",
  successBody = "Your inquiry has reached our admissions team. Expect a reply within two working days.",
  className,
}: InquiryFormProps) {
  const formId = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const submitInquiry = useSubmitInquiry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryCreateInput>({
    resolver: zodResolver(inquiryCreateSchema),
    defaultValues: {
      applicant_name: "",
      parent_name: "",
      parent_email: "",
      parent_phone: null,
      desired_class: null,
      message: null,
    },
  });

  async function onSubmit(values: InquiryCreateInput) {
    setSubmitError(null);
    try {
      await submitInquiry.mutateAsync(values);
      reset();
      setSucceeded(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (succeeded) {
    return (
      <div
        role="status"
        className={cn(
          "flex flex-col items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
          className,
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--success-bg)] text-[var(--success-fg)]">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">
          {successHeading}
        </h3>
        <p className="max-w-sm leading-relaxed text-[var(--muted-foreground)]">{successBody}</p>
        <button
          type="button"
          onClick={() => setSucceeded(false)}
          className="mt-3 rounded-md text-sm font-medium text-[var(--m-brand)] outline-none transition-colors hover:text-[var(--m-brand-deep)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn(
        "space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8",
        className,
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-applicant_name`} className={labelClass}>
            Child&apos;s / applicant&apos;s name
          </label>
          <input
            id={`${formId}-applicant_name`}
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.applicant_name}
            aria-describedby={errors.applicant_name ? `${formId}-applicant_name-err` : undefined}
            className={fieldClass}
            {...register("applicant_name")}
          />
          {errors.applicant_name && (
            <p id={`${formId}-applicant_name-err`} className={errorClass}>
              {errors.applicant_name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-parent_name`} className={labelClass}>
            Parent / guardian name
          </label>
          <input
            id={`${formId}-parent_name`}
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.parent_name}
            aria-describedby={errors.parent_name ? `${formId}-parent_name-err` : undefined}
            className={fieldClass}
            {...register("parent_name")}
          />
          {errors.parent_name && (
            <p id={`${formId}-parent_name-err`} className={errorClass}>
              {errors.parent_name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-parent_email`} className={labelClass}>
            Email
          </label>
          <input
            id={`${formId}-parent_email`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.parent_email}
            aria-describedby={errors.parent_email ? `${formId}-parent_email-err` : undefined}
            className={fieldClass}
            {...register("parent_email")}
          />
          {errors.parent_email && (
            <p id={`${formId}-parent_email-err`} className={errorClass}>
              {errors.parent_email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-parent_phone`} className={labelClass}>
            Phone <span className={optionalHint}>(optional)</span>
          </label>
          <input
            id={`${formId}-parent_phone`}
            type="tel"
            autoComplete="tel"
            placeholder="+233 24 555 0110"
            disabled={isSubmitting}
            aria-invalid={!!errors.parent_phone}
            className={fieldClass}
            {...register("parent_phone", { setValueAs: emptyToNull })}
          />
          {errors.parent_phone && <p className={errorClass}>{errors.parent_phone.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-desired_class`} className={labelClass}>
            Desired class <span className={optionalHint}>(optional)</span>
          </label>
          <select
            id={`${formId}-desired_class`}
            defaultValue=""
            disabled={isSubmitting}
            className={cn(fieldClass, "appearance-none")}
            {...register("desired_class", { setValueAs: emptyToNull })}
          >
            <option value="">Select a class…</option>
            {DESIRED_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-message`} className={labelClass}>
          Message <span className={optionalHint}>(optional)</span>
        </label>
        <textarea
          id={`${formId}-message`}
          rows={4}
          placeholder="Tell us a little about your child, or ask us anything."
          disabled={isSubmitting}
          className={cn(fieldClass, "resize-y")}
          {...register("message", { setValueAs: emptyToNull })}
        />
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--m-brand)] px-6 text-[0.95rem] font-medium text-white shadow-sm outline-none transition-[background-color,box-shadow] duration-200 hover:bg-[var(--m-brand-deep)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
    </form>
  );
}
