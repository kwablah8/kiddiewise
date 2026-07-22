import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StudentAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/** Photo when set, initials fallback otherwise (06-UI §6 "Profile chip"). */
export function StudentAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "default",
  className,
}: StudentAvatarProps) {
  const name = `${firstName} ${lastName}`;
  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback className="bg-[var(--success-bg)] font-medium text-[var(--success-fg)]">
        {formatInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
