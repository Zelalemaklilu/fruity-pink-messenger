import { Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getVoiceRoom } from "@/lib/voiceChatService";

interface VoiceChatBannerProps {
  roomId: string;
  onJoin: () => void;
}

export function VoiceChatBanner({ roomId, onJoin }: VoiceChatBannerProps) {
  const room = getVoiceRoom(roomId);

  if (!room || !room.isActive) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="flex-shrink-0 bg-green-500/10 border-b border-green-500/20"
      data-testid="banner-voice-chat-active"
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="h-4 w-4 text-green-500" />
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Activity className="h-4 w-4 text-green-500" />
            </motion.div>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Voice Chat Active
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{room.participants.length}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="default"
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={onJoin}
          data-testid="button-join-voice-chat"
        >
          Join
        </Button>
      </div>
    </motion.div>
  );
}
