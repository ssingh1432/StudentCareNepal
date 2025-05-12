import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UsersIcon } from "lucide-react";

interface AvatarWithPlaceholderProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  className?: string;
}

export function AvatarWithPlaceholder({
  src,
  alt,
  fallbackText,
  className
}: AvatarWithPlaceholderProps) {
  // Get initials for fallback
  const initials = fallbackText || 
    alt.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <Avatar className={className}>
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback className="bg-purple-100 text-purple-600">
        {initials || <User className="h-5 w-5" />}
      </AvatarFallback>
    </Avatar>
  );
}
