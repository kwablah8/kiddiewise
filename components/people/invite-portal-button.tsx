"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useInvitePortal } from "@/lib/queries/people";

/**
 * Grants a parent or staff member access to their portal.
 *
 * Two delivery routes, and the copy-a-link one is listed FIRST on purpose: schools here coordinate
 * with parents over WhatsApp, so pasting a link into a chat is both the likeliest channel and the one
 * where the admin can see it arrived. Email is there for the people who use email.
 *
 * Nothing is sent until the admin picks a route — opening this dialog is not itself an invitation.
 */
export function InvitePortalButton({
  profileId,
  personName,
  label = "Invite",
}: {
  profileId: string;
  personName: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const invite = useInvitePortal();

  function reset() {
    setLink(null);
    setCopied(false);
    invite.reset();
  }

  async function send(delivery: "email" | "link") {
    try {
      const result = await invite.mutateAsync({ profile_id: profileId, delivery });
      if (delivery === "link" && result.link) {
        setLink(result.link);
        return;
      }
      toast.success("Invitation sent", {
        description: `${personName} will get an email at ${result.email}.`,
      });
      setOpen(false);
    } catch (err) {
      toast.error("Couldn't send that invitation", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      // Reverts so the button reads as re-copyable rather than permanently "done".
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused on insecure origins and in some embedded browsers. The input
      // below holds the link either way, so the admin can still select it by hand.
      toast.error("Couldn't copy automatically — select the link and copy it manually.");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{link ? "Send this link" : `Invite ${personName}`}</DialogTitle>
            <DialogDescription>
              {link
                ? "The link lets them set their own password. It works once and expires in 24 hours."
                : "They'll choose their own password — you never see or set it."}
            </DialogDescription>
          </DialogHeader>

          {link ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* readOnly, not disabled: the admin must still be able to select the text if the
                    clipboard API is unavailable. */}
                <Input readOnly value={link} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">Copy invite link</span>
                </Button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Paste it into WhatsApp, SMS, or wherever you normally reach them.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full justify-start"
                disabled={invite.isPending}
                onClick={() => send("link")}
              >
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                Get a link to send myself
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={invite.isPending}
                onClick={() => send("email")}
              >
                <Mail className="size-4" aria-hidden="true" />
                Email the invitation to them
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {link ? "Done" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
