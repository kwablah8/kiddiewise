"use client";

import hotToast, { type ToastOptions } from "react-hot-toast";
import type { ReactElement, ReactNode } from "react";

/**
 * Toast adapter over react-hot-toast.
 *
 * react-hot-toast takes a single message; it has no `description` concept. Nearly every call site in
 * this app is a two-part message — "Attendance saved" plus "4 students left unmarked" — because the
 * second line is where the actionable detail lives. Rather than flatten 50 of those into single
 * strings (losing the visual hierarchy) or rewrite every call site, this keeps the
 * `(message, { description })` shape and renders it as a titled toast.
 *
 * It also means the app never imports a toast library directly, so swapping the implementation again
 * is a one-file change rather than a 33-file sweep.
 */

interface AppToastOptions extends Omit<ToastOptions, "id"> {
  /** Secondary line under the title. Where the detail worth reading usually goes. */
  description?: ReactNode;
  id?: string;
}

/**
 * Title + optional description, with the title carrying the weight.
 *
 * Returns ReactElement rather than ReactNode: react-hot-toast's `Message` type excludes `undefined`,
 * and this always renders an element.
 */
function body(message: ReactNode, description?: ReactNode): ReactElement {
  if (!description) return <span className="text-sm font-medium">{message}</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-medium leading-snug">{message}</span>
      <span className="text-xs leading-snug text-[var(--muted-foreground)]">{description}</span>
    </span>
  );
}

function split(options?: AppToastOptions): { description?: ReactNode; rest: ToastOptions } {
  if (!options) return { rest: {} };
  const { description, ...rest } = options;
  return { description, rest };
}

/**
 * Same surface the app already used, so call sites only change their import.
 *
 * `message` maps to a plain neutral toast — react-hot-toast has no `.message`, and a neutral
 * "nothing to do yet" must not wear a success tick.
 */
export const toast = {
  success(message: ReactNode, options?: AppToastOptions) {
    const { description, rest } = split(options);
    return hotToast.success(body(message, description), rest);
  },
  error(message: ReactNode, options?: AppToastOptions) {
    const { description, rest } = split(options);
    // Errors get longer on screen: they are usually the ones a user needs to read and act on.
    return hotToast.error(body(message, description), { duration: 6000, ...rest });
  },
  message(message: ReactNode, options?: AppToastOptions) {
    const { description, rest } = split(options);
    return hotToast(body(message, description), rest);
  },
  loading(message: ReactNode, options?: AppToastOptions) {
    const { description, rest } = split(options);
    return hotToast.loading(body(message, description), rest);
  },
  dismiss(id?: string) {
    hotToast.dismiss(id);
  },
};
