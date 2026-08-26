"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { useCreateEvent, useUpdateEvent } from "@/lib/queries/communication";
import {
  eventCreateSchema,
  type EventCreateInput,
  type EventVM,
} from "@/lib/validators/communication";

type FormInput = z.input<typeof eventCreateSchema>;

/**
 * `datetime-local` needs "YYYY-MM-DDTHH:mm" with no zone, but the column is timestamptz and comes
 * back as an ISO string. Slicing rather than reformatting keeps the wall-clock time the admin typed
 *, a 9am assembly must not drift an hour because of how the value round-tripped.
 */
function toLocalInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

export function EventFormDialog({
  mode,
  event,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  event?: EventVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const create = useCreateEvent();
  const update = useUpdateEvent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, EventCreateInput>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues:
      mode === "edit" && event
        ? {
            title: event.title,
            description: event.description,
            start_at: toLocalInput(event.start_at),
            end_at: toLocalInput(event.end_at),
            location: event.location,
          }
        : { title: "", description: null, start_at: "", end_at: null, location: null },
  });

  async function onSubmit(values: EventCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await create.mutateAsync(values);
      } else if (event) {
        await update.mutateAsync({ id: event.id, ...values });
      }
      toast.success(mode === "create" ? "Event added" : "Event updated", {
        description: `${values.title} is on the school calendar.`,
      });
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New event" : "Edit event"}</DialogTitle>
            <DialogDescription>
              This appears on the staff and parent dashboards as soon as you save it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev_title">Name</Label>
              <Input
                id="ev_title"
                placeholder="Speech and Prize-Giving Day"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-[var(--danger)]">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev_start">Starts</Label>
                <Input
                  id="ev_start"
                  type="datetime-local"
                  aria-invalid={!!errors.start_at}
                  {...register("start_at")}
                />
                {errors.start_at && (
                  <p className="text-xs text-[var(--danger)]">{errors.start_at.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev_end">Ends (optional)</Label>
                <Input
                  id="ev_end"
                  type="datetime-local"
                  aria-invalid={!!errors.end_at}
                  {...register("end_at", { setValueAs: (v) => (v === "" ? null : v) })}
                />
                {errors.end_at && (
                  <p className="text-xs text-[var(--danger)]">{errors.end_at.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev_location">Where (optional)</Label>
              <Input
                id="ev_location"
                placeholder="School assembly hall"
                {...register("location", { setValueAs: (v) => (v === "" ? null : v) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev_description">Details (optional)</Label>
              <textarea
                id="ev_description"
                rows={3}
                placeholder="Anything parents need to know"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("description", { setValueAs: (v) => (v === "" ? null : v) })}
              />
            </div>

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "create" ? "Add event" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
