"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
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
import { CredentialsDialog } from "./credentials-dialog";
import { useReissueCredentials } from "@/lib/queries/people";
import type { IssuedCredentials } from "@/lib/temp-password";

/**
 * Issues a fresh temporary password for a staff member or parent, then shows it once.
 *
 * Confirmed rather than immediate, because the label undersells what the button does: "send
 * credentials" sounds like re-sending details the school already has, when it actually REVOKES the
 * password the person is currently using. For someone who has already taken ownership of their
 * account that is a lockout, and the old password cannot be restored; it is a bcrypt hash. One
 * sentence of warning is cheap; an unannounced reset costs a phone call to whoever it hit.
 *
 * Shared by the staff and parents tables rather than written twice: they are the same operation on
 * the same `profiles` row, and a confirmation that exists on one list but not the other is the kind
 * of drift that makes the safer path feel optional.
 */
export function SendCredentialsButton({
  profileId,
  personName,
}: {
  profileId: string;
  personName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const reissue = useReissueCredentials();

  async function issue() {
    try {
      // Order matters: close the confirmation only once the credentials are in hand, so a failure
      // leaves the admin looking at the dialog they can retry from rather than at the bare table.
      const credentials = await reissue.mutateAsync({ profile_id: profileId });
      setConfirming(false);
      setIssued(credentials);
    } catch (err) {
      toast.error("Couldn't issue credentials", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        <KeyRound className="size-3.5" aria-hidden="true" />
        Send credentials
      </Button>

      <Dialog
        open={confirming}
        // Not dismissible mid-request: the password is already being rotated server-side, and
        // closing here would lose the only copy of it.
        onOpenChange={(next) => !reissue.isPending && setConfirming(next)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue a new password for {personName}?</DialogTitle>
            <DialogDescription>
              Their current password stops working straight away. You&apos;ll get a new temporary one
              to send them — shown once — which they must replace when they next sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={reissue.isPending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={reissue.isPending} onClick={issue}>
              {reissue.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Issue password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CredentialsDialog credentials={issued} onClose={() => setIssued(null)} />
    </>
  );
}
