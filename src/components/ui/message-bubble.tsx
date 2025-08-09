import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  className?: string;
}

export function MessageBubble({ message, timestamp, isOwn, status, className }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex w-full",
      isOwn ? "justify-end" : "justify-start",
      className
    )}>
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2 transition-smooth",
        isOwn 
          ? "bg-chat-bubble-outgoing text-chat-text-outgoing ml-4" 
          : "bg-chat-bubble-incoming text-chat-text-incoming mr-4"
      )}>
        <p className="text-sm leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">{timestamp}</span>
          {isOwn && status && (
            <div className="text-xs opacity-70">
              {status === "sent" && <Check className="h-3 w-3" />}
              {status === "delivered" && <CheckCheck className="h-3 w-3" />}
              {status === "read" && <CheckCheck className="h-3 w-3 text-primary" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}