import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "offline";
  className?: string;
}

export function ChatAvatar({ src, name, size = "md", status, className }: ChatAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size], "border border-border")}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <div 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            {
              "bg-status-online": status === "online",
              "bg-status-away": status === "away", 
              "bg-status-offline": status === "offline"
            }
          )}
        />
      )}
    </div>
  );
}