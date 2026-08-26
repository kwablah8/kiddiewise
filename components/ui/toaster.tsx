"use client";

import { Toaster as HotToaster } from "react-hot-toast";
import { CircleCheckIcon, Loader2Icon, OctagonXIcon } from "lucide-react";

/**
 * Toast host. Mounted once in the (app) layout.
 *
 * Styled with the design tokens rather than react-hot-toast's defaults, so toasts match the rest of
 * the app and follow light/dark automatically, the CSS variables already flip with the theme, which
 * is why nothing here reads `next-themes` (the previous sonner wrapper had to).
 *
 * Icons are the project's lucide set, replacing the library's built-in emoji-style marks, so a toast
 * looks like it belongs to this product.
 */
export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      // 12px in from the edges; the default 8px sits too tight against the viewport.
      containerStyle={{ inset: 12 }}
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.18)",
          padding: "10px 14px",
          // Bounded so a long error wraps into a readable block rather than one wide line, and never
          // exceeds a narrow viewport.
          maxWidth: "min(24rem, calc(100vw - 24px))",
        },
        success: {
          icon: <CircleCheckIcon className="size-4 shrink-0 text-[var(--success-fg)]" />,
        },
        error: {
          icon: <OctagonXIcon className="size-4 shrink-0 text-[var(--danger)]" />,
        },
        loading: {
          icon: <Loader2Icon className="size-4 shrink-0 animate-spin text-[var(--muted-foreground)]" />,
        },
      }}
    />
  );
}
