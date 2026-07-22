import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A shaped placeholder for loading states (06-UI §7: "Skeletons that match final layout,
 * not spinners-on-blank"). Thin wrapper over the shadcn Skeleton with our card radius.
 */
export function SkeletonBlock({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("rounded-xl", className)} {...props} />;
}
