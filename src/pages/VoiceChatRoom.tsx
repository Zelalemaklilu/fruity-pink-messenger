import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Mic, MicOff, Hand, PhoneOff, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getVoiceRoom,
  joinVoiceRoom,
  leaveVoiceRoom,
  toggleMute,
  toggleHandRaise,
  endVoiceRoom,
  simulateSpeaking,
  type VoiceRoom,
  type VoiceParticipant,
} from "@/lib/voiceChatService";
import { chatStore } from "@/lib/chatStore";

interface ParticipantCardProps {
  participant: VoiceParticipant;
  isCurrentUser: boolean;
}

const ParticipantCard = ({ participant, isCurrentUser }: ParticipantCardProps) => {
  const initials = participant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`participant-card-${participant.userId}`}>
      <div className="relative">
        <AnimatePresence>
          {participant.isSpeaking && (
            <motion.div
              key="speaking-ring"
              className="absolute inset-0 rounded-full border-2 border-green-400"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {participant.isSpeaking && (
            <motion.div
              key="speaking-glow"
              className="absolute inset-0 rounded-full bg-green-400/20"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
        <motion.div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold border-2",
            participant.isSpeaking
              ? "border-green-400 bg-green-500/20 text-green-400"
              : participant.isMuted
                ? "border-destructive/50 bg-muted text-muted-foreground"
                : "border-primary/50 bg-primary/10 text-primary",
            isCurrentUser && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
          )}
          animate={participant.isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: participant.isSpeaking ? Infinity : 0 }}
        >
          {initials}
        </motion.div>

        {participant.isMuted && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
            <MicOff className="h-3 w-3 text-destructive-foreground" />
          </div>
        )}

        {participant.isHandRaised && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Hand className="h-3 w-3 text-yellow-950" />
          </motion.div>
        )}
      </div>

      <span className={cn(
        "text-xs font-medium text-center truncate max-w-[80px]",
        isCurrentUser ? "text-primary" : "text-foreground",
      )}>
        {isCurrentUser ? "You" : participant.name}
      </span>
    </div>
  );
};

const VoiceChatRoom = () => {
  const navigate = useNavigate();
  const { id: roomId } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [room, setRoom] = useState<VoiceRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("You");

  const refreshRoom = useCallback(() => {
    if (!roomId) return;
    const r = getVoiceRoom(roomId);
    if (r) {
      setRoom(r);
    } else {
      setRoom(null);
    }
  }, [roomId]);

  useEffect(() => {
    if (!userId) return;
    chatStore.getProfile(userId).then((profile) => {
      if (profile) {
        setUserName(profile.name || profile.username || "You");
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!roomId || !userId) return;
    const r = getVoiceRoom(roomId);
    if (!r || !r.isActive) {
      toast.error("Voice room not found or ended");
      navigate(-1);
      return;
    }
    if (!r.participants.find((p) => p.userId === userId)) {
      joinVoiceRoom(roomId, userId, userName);
    }
    refreshRoom();
    setLoading(false);
  }, [roomId, userId, userName, navigate, refreshRoom]);

  useEffect(() => {
    if (!roomId || !room?.isActive) return;
    const interval = setInterval(() => {
      simulateSpeaking(roomId);
      refreshRoom();
    }, 2500);
    return () => clearInterval(interval);
  }, [roomId, room?.isActive, refreshRoom]);

  const handleToggleMute = () => {
    if (!roomId || !userId) return;
    toggleMute(roomId, userId);
    refreshRoom();
  };

  const handleToggleHand = () => {
    if (!roomId || !userId) return;
    toggleHandRaise(roomId, userId);
    refreshRoom();
  };

  const handleLeave = () => {
    if (!roomId || !userId) return;
    leaveVoiceRoom(roomId, userId);
    toast.success("Left voice chat");
    navigate(-1);
  };

  const handleEndForAll = () => {
    if (!roomId) return;
    endVoiceRoom(roomId);
    toast.success("Voice chat ended for all");
    navigate(-1);
  };

  if (loading || !room) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const currentParticipant = room.participants.find((p) => p.userId === userId);
  const isCreator = room.createdBy === userId;

  if (!room.isActive) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <PhoneOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">This voice chat has ended</p>
        <Button onClick={() => navigate(-1)} data-testid="button-go-back">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{room.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate">{room.groupName}</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{room.participants.length}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeave}
            data-testid="button-close-voice-chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 justify-items-center max-w-sm mx-auto">
          {room.participants.map((p) => (
            <ParticipantCard
              key={p.userId}
              participant={p}
              isCurrentUser={p.userId === userId}
            />
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur p-6">
        <div className="flex items-center justify-center gap-6">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              variant={currentParticipant?.isMuted ? "destructive" : "secondary"}
              className="w-14 h-14 rounded-full"
              onClick={handleToggleMute}
              data-testid="button-toggle-mute"
            >
              {currentParticipant?.isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              variant={currentParticipant?.isHandRaised ? "default" : "secondary"}
              className="w-14 h-14 rounded-full"
              onClick={handleToggleHand}
              data-testid="button-toggle-hand"
            >
              <Hand className="h-6 w-6" />
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              variant="destructive"
              className="w-14 h-14 rounded-full"
              onClick={handleLeave}
              data-testid="button-leave-voice-chat"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </motion.div>

          {isCreator && (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="destructive"
                className="w-14 h-14 rounded-full"
                onClick={handleEndForAll}
                data-testid="button-end-voice-chat"
              >
                <X className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChatRoom;
