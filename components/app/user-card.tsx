import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { formatInitials, formatRole } from "@/lib/format";
import { cn } from "@/lib/utils";
import { navFocusRingClass } from "@/lib/ui";

interface UserCardProps {
  profile: Profile;
  collapsed?: boolean;
  onSignOut: () => void;
}

/** Avatar (initials fallback) + name + role, with logout in danger red (06-UI §5). */
export function UserCard({ profile, collapsed, onSignOut }: UserCardProps) {
  const name = `${profile.first_name} ${profile.last_name}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-white/5 p-3",
        collapsed && "flex-col gap-2",
      )}
    >
      <Avatar className="shrink-0">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
        <AvatarFallback className="bg-white/10 text-sm font-medium text-white">
          {formatInitials(profile.first_name, profile.last_name)}
        </AvatarFallback>
      </Avatar>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <p className="truncate text-xs text-white/70">{formatRole(profile.role)}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSignOut}
        aria-label="Log out"
        title="Log out"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10",
          navFocusRingClass,
        )}
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
