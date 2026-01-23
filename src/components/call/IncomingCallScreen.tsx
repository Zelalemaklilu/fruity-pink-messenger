import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from '@/components/ui/chat-avatar';
import { useCall } from '@/contexts/CallContext';
import { useEffect, useRef } from 'react';

export const IncomingCallScreen = () => {
  const { activeCall, acceptCall, rejectCall } = useCall();
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play ringtone
    try {
      ringtoneRef.current = new Audio('/ringtone.mp3');
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {
        // Autoplay might be blocked
        console.log('Ringtone autoplay blocked');
      });
    } catch (err) {
      console.log('Could not play ringtone');
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  if (!activeCall) return null;

  const isVideoCall = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background via-background to-primary/20 flex flex-col items-center justify-center p-8">
      {/* Animated rings */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/30 scale-125" />
        <ChatAvatar
          name={activeCall.peerName}
          src={activeCall.peerAvatar}
          size="xl"
          className="relative z-10 w-32 h-32 ring-4 ring-primary/50"
        />
      </div>

      {/* Caller info */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {activeCall.peerName}
        </h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          {isVideoCall ? (
            <>
              <Video className="h-5 w-5" />
              <span>Incoming video call...</span>
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              <span>Incoming voice call...</span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-12">
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full"
            onClick={rejectCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <span className="text-sm text-muted-foreground">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-call-accept hover:bg-call-accept/90 text-call-accept-foreground"
            onClick={acceptCall}
          >
            {isVideoCall ? (
              <Video className="h-7 w-7" />
            ) : (
              <Phone className="h-7 w-7" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">Accept</span>
        </div>
      </div>
    </div>
  );
};
