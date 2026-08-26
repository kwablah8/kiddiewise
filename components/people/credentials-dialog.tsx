"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSchool } from "@/lib/queries/school";
import {
  credentialsMessage,
  TEMP_PASSWORD_DAYS,
  type IssuedCredentials,
} from "@/lib/temp-password";

/**
 * Shows admin-issued credentials ONCE.
 *
 * "Once" is not a UX choice, the password is stored as a bcrypt hash, so after this dialog closes
 * there is genuinely nothing left to display. The warning says so plainly, because an admin who
 * assumes they can look it up later will close this and then have to reissue.
 *
 * The primary action copies a ready-to-send WhatsApp message rather than the bare password: that is
 * the actual task ("get these details to the parent"), and it saves the admin retyping the login URL
 * and their own explanation every time.
 */
export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: IssuedCredentials | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"message" | "password" | null>(null);
  // Read from the tenant rather than taken as a prop: a hardcoded name would be wrong for every
  // school but one, and would stay wrong after a rebrand. "SLIS" only covers the moment before the
  // query resolves.
  const { data: school } = useSchool();
  const schoolName = school?.name ?? "SLIS";

  if (!credentials) return null;

  const loginUrl = `${window.location.origin}/login`;
  const message = credentialsMessage({
    schoolName,
    personName: credentials.personName,
    email: credentials.email,
    tempPassword: credentials.tempPassword,
    loginUrl,
  });

  async function copy(what: "message" | "password") {
    try {
      await navigator.clipboard.writeText(what === "message" ? message : credentials!.tempPassword);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy automatically — select the text and copy it manually.");
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credentials for {credentials.personName}</DialogTitle>
          <DialogDescription>
            Send these to them however you normally would — WhatsApp, SMS, or written on the admission
            slip. They&apos;ll be asked to choose their own password when they first sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-[var(--warning-border,var(--border))] bg-[var(--warning-bg,var(--bg))] p-3">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-[var(--warning-fg,var(--text))]"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-[var(--text)]">
              This password is shown <strong>once</strong>. We store it encrypted, so it can&apos;t be
              looked up later — if you lose it, use <em>Send credentials</em> on the list to issue a
              new one. It expires in {TEMP_PASSWORD_DAYS} days if unused.
            </p>
          </div>

          <dl className="space-y-2 rounded-lg border border-[var(--border)] p-3">
            <div className="space-y-1 pb-1">
              <dt className="text-xs text-[var(--muted-foreground)]">Email</dt>
              <dd className="select-all break-all font-mono text-sm text-[var(--text)]">
                {credentials.email}
              </dd>
            </div>
            <div className="space-y-1.5 border-t border-[var(--border)] pt-2">
              <dt className="text-xs text-[var(--muted-foreground)]">Temporary password</dt>
              <dd className="flex items-center gap-2">
                {/*
                  Its own full-width row, and `whitespace-nowrap`: sharing a row with the label wrapped
                  the value mid-password ("Heron-59462-" / "Meadow"), which is exactly how a credential
                  gets mistranscribed onto an admission slip. `overflow-x-auto` keeps it on one line on
                  a narrow screen instead of breaking it. Selectable so it works even where the
                  clipboard API is blocked.
                */}
                <code className="flex-1 select-all overflow-x-auto whitespace-nowrap rounded-md bg-[var(--bg)] px-2.5 py-2 font-mono text-base font-semibold tracking-tight text-[var(--text)]">
                  {credentials.tempPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => copy("password")}
                >
                  {copied === "password" ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  <span className="sr-only">Copy password</span>
                </Button>
              </dd>
            </div>
          </dl>

          <Button type="button" className="w-full" onClick={() => copy("message")}>
            {copied === "message" ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copied === "message" ? "Message copied" : "Copy WhatsApp message"}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
