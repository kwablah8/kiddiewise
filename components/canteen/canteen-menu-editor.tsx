"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send, Undo2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/data/status-pill";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { ErrorState } from "@/components/states/error-state";
import {
  useCanteenMenu,
  useSaveCanteenMenu,
  usePublishCanteenMenu,
  useUnpublishCanteenMenu,
} from "@/lib/queries/canteen";
import {
  canteenMenuFormSchema,
  WEEKDAY_ORDER,
  WEEKDAY_LABEL,
  type CanteenMenuFormInput,
} from "@/lib/validators/canteen";
import { cardShellClass, textareaClass } from "@/lib/ui";

const EMPTY_FORM: CanteenMenuFormInput = {
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
};

/** The whole week, one form, one Save. Publish/unpublish apply to the saved menu as a whole. */
export function CanteenMenuEditor() {
  const { data, isLoading, isError, refetch } = useCanteenMenu();
  const save = useSaveCanteenMenu();
  const publish = usePublishCanteenMenu();
  const unpublish = useUnpublishCanteenMenu();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CanteenMenuFormInput>({
    resolver: zodResolver(canteenMenuFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Populate the form once the saved menu loads — `reset` rather than `values` (used elsewhere in
  // this app for an edit dialog that always mirrors the server) because this form has its own
  // unsaved-draft lifecycle: a save shouldn't be silently overwritten by a background refetch.
  useEffect(() => {
    if (!data) return;
    const byDay = new Map(data.map((item) => [item.day_of_week, item.description]));
    reset({
      monday: byDay.get("monday") ?? "",
      tuesday: byDay.get("tuesday") ?? "",
      wednesday: byDay.get("wednesday") ?? "",
      thursday: byDay.get("thursday") ?? "",
      friday: byDay.get("friday") ?? "",
    });
    // Only re-sync when the query resolves, not on every render `reset` itself would trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {WEEKDAY_ORDER.map((d) => (
          <SkeletonBlock key={d} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className={cardShellClass}>
        <ErrorState message="Couldn't load the canteen menu." onRetry={() => refetch()} />
      </div>
    );
  }

  const savedCount = data?.length ?? 0;
  const publishedCount = data?.filter((i) => i.is_published).length ?? 0;
  const status =
    savedCount === 0 ? null : publishedCount === savedCount ? "published" : publishedCount === 0 ? "draft" : "partial";

  async function onSubmit(values: CanteenMenuFormInput) {
    try {
      await save.mutateAsync(values);
      toast.success("Menu saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handlePublishToggle() {
    try {
      if (status === "published") {
        await unpublish.mutateAsync();
        toast.success("Menu unpublished", { description: "Parents no longer see it." });
      } else {
        await publish.mutateAsync();
        toast.success("Menu published", { description: "Parents can now see it." });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cardShellClass} noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <p className="text-sm font-semibold text-[var(--text)]">This week&apos;s menu</p>
          {status === "published" && <StatusPill label="Published" tone="success" />}
          {status === "partial" && <StatusPill label="Partially published" tone="warning" />}
          {status === "draft" && <StatusPill label="Draft" tone="neutral" />}
          {status === null && <span className="text-xs text-[var(--muted-foreground)]">Nothing set yet</span>}
        </div>
        {savedCount > 0 && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePublishToggle}
            disabled={publish.isPending || unpublish.isPending}>
            {(publish.isPending || unpublish.isPending) ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : status === "published" ? (
              <Undo2 className="size-4" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {status === "published" ? "Unpublish menu" : "Publish menu"}
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {WEEKDAY_ORDER.map((day) => (
          <div key={day} className="space-y-1.5">
            <Label htmlFor={`canteen-${day}`}>{WEEKDAY_LABEL[day]}</Label>
            <textarea
              id={`canteen-${day}`}
              rows={2}
              className={textareaClass}
              placeholder={`What's on the menu for ${WEEKDAY_LABEL[day]}? Leave blank to clear it.`}
              {...register(day)}
            />
            {errors[day] && <p className="text-xs text-[var(--danger)]">{errors[day]?.message}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save menu
        </Button>
      </div>
    </form>
  );
}
