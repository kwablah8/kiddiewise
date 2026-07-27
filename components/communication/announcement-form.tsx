"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAnnouncement, useUpdateAnnouncement } from "@/lib/queries/communication";
import {
  ANNOUNCEMENT_AUDIENCE_LABEL,
  announcementCreateSchema,
  type AnnouncementAudience,
  type AnnouncementCreateInput,
  type AnnouncementVM,
} from "@/lib/validators/communication";

type FormInput = z.input<typeof announcementCreateSchema>;

const AUDIENCES: AnnouncementAudience[] = ["everyone", "parents", "teachers"];

/** Write or edit an announcement. Audience and publish state are both real: RLS enforces them. */
export function AnnouncementFormDialog({
  mode,
  announcement,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  announcement?: AnnouncementVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, AnnouncementCreateInput>({
    resolver: zodResolver(announcementCreateSchema),
    defaultValues:
      mode === "edit" && announcement
        ? {
            title: announcement.title,
            body: announcement.body,
            audience: announcement.audience,
            is_published: announcement.is_published,
          }
        : { title: "", body: "", audience: "everyone", is_published: false },
  });

  async function onSubmit(values: AnnouncementCreateInput) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await create.mutateAsync(values);
      } else if (announcement) {
        await update.mutateAsync({ id: announcement.id, ...values });
      }
      toast.success(mode === "create" ? "Announcement saved" : "Announcement updated", {
        description: values.is_published
          ? `Visible to ${ANNOUNCEMENT_AUDIENCE_LABEL[values.audience].toLowerCase()} now.`
          : "Saved as a draft — nobody outside the office can see it yet.",
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
            <DialogTitle>
              {mode === "create" ? "New announcement" : "Edit announcement"}
            </DialogTitle>
            <DialogDescription>
              Choose who it reaches. Nothing is visible until you publish it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann_title">Title</Label>
              <Input
                id="ann_title"
                placeholder="Mid-term break"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-[var(--danger)]">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann_body">Message</Label>
              <textarea
                id="ann_body"
                rows={5}
                placeholder="What do you want them to know?"
                aria-invalid={!!errors.body}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("body")}
              />
              {errors.body && <p className="text-xs text-[var(--danger)]">{errors.body.message}</p>}
            </div>

            <Controller
              control={control}
              name="audience"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label>Who sees it</Label>
                  <Select value={field.value ?? "everyone"} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: string) =>
                          ANNOUNCEMENT_AUDIENCE_LABEL[v as AnnouncementAudience] ?? "Everyone"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ANNOUNCEMENT_AUDIENCE_LABEL[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Controller
              control={control}
              name="is_published"
              render={({ field }) => (
                <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span className="text-[var(--text)]">Publish now</span>
                </label>
              )}
            />

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "create" ? "Save announcement" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
