import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/** Initials avatar for staff, StaffVM carries no photo field (06-UI §6 "Profile chip"). */
export function StaffAvatar({ firstName, lastName, size = "default", className }: StaffAvatarProps) {
  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      <AvatarFallback className="bg-[var(--success-bg)] font-medium text-[var(--success-fg)]">
        {formatInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
