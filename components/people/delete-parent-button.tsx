"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { useDeleteParent, useParentDeletionImpact } from "@/lib/queries/people";

/**
 * Permanently deletes a parent and their portal account from the parents list row. Unconditional
 * (lib/actions/people.ts#deleteParent), the admin decides after seeing what goes with them; linked
 * children are unaffected, only the guardian link disappears (migration 0005).
 */
export function DeleteParentButton({ profileId, personName }: { profileId: string; personName: string }) {
  const [open, setOpen] = useState(false);
  const deleteParent = useDeleteParent();
  const { data: impact, isLoading: impactLoading } = useParentDeletionImpact(profileId);

  async function handleConfirm() {
    try {
      await deleteParent.mutateAsync({ id: profileId });
      toast.success("Parent deleted", { description: `${personName} has been removed.` });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${personName}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4 text-[var(--danger)]" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete parent?</DialogTitle>
            <DialogDescription>
              <strong className="text-[var(--text)]">{personName}</strong> and their portal account
              will be permanently removed. This cannot be undone. Any linked children stay in the
              system, they just lose this guardian.
            </DialogDescription>
          </DialogHeader>
          {!impactLoading && (impact?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-[var(--warning-border,var(--border))] bg-[var(--warning-bg,var(--bg))] p-3">
              <p className="text-xs font-medium text-[var(--text)]">This affects:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-[var(--text)]">
                {impact!.map((i) => (
                  <li key={i.label}>{i.count} {i.label}</li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteParent.isPending}>
              {deleteParent.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Delete Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
