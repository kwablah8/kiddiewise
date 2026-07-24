import type { Profile } from "@/lib/types";

/** Teacher-portal greeting + identity chip (06-UI §8: friendlier tone). */
export function GreetingHeader({ profile }: { profile: Profile }) {
  const chips = [profile.department, profile.staff_no].filter(Boolean) as string[];
  return (
    <div>
      <h1 className="text-[28px] font-semibold text-[var(--text)]">
        Welcome back, {profile.first_name} 👋
      </h1>
      {chips.length > 0 && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{chips.join(" · ")}</p>
      )}
    </div>
  );
}
