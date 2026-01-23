import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from '@/components/ui/chat-avatar';
import { useCall } from '@/contexts/CallContext';
import { useEffect, useRef, useCallback } from 'react';

// Preload the ringtone for faster playback
const RINGTONE_URL = '/ringtone.mp3';

export const IncomingCallScreen = () => {
  const { activeCall, acceptCall, rejectCall } = useCall();
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const startRingtone = useCallback(() => {
    if (isPlayingRef.current || !activeCall) return;
    
    try {
      // Create new audio instance
      const audio = new Audio(RINGTONE_URL);
      audio.loop = true;
      audio.volume = 0.7;
      
      // Store reference
      ringtoneRef.current = audio;
      isPlayingRef.current = true;
      
      // Play with error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[Ringtone] Autoplay blocked:', error.message);
          isPlayingRef.current = false;
        });
      }
    } catch (err) {
      console.warn('[Ringtone] Could not initialize:', err);
      isPlayingRef.current = false;
    }
  }, [activeCall]);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.src = '';
      ringtoneRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Start ringtone on mount, stop on unmount
  useEffect(() => {
    startRingtone();
    
    return () => {
      stopRingtone();
    };
  }, [startRingtone, stopRingtone]);

  // Handle accept - stop ringtone first
  const handleAccept = useCallback(() => {
    stopRingtone();
    acceptCall();
  }, [stopRingtone, acceptCall]);

  // Handle reject - stop ringtone first
  const handleReject = useCallback(() => {
    stopRingtone();
    rejectCall();
  }, [stopRingtone, rejectCall]);

  if (!activeCall) return null;

  const isVideoCall = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background via-background to-primary/20 flex flex-col items-center justify-center p-8">
      {/* Animated rings */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150" style={{ animationDuration: '2s' }} />
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
            className="w-16 h-16 rounded-full animate-pulse"
            style={{ animationDuration: '1.5s' }}
            onClick={handleReject}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <span className="text-sm text-muted-foreground">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-call-accept hover:bg-call-accept/90 text-call-accept-foreground animate-pulse"
            style={{ animationDuration: '1.5s' }}
            onClick={handleAccept}
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
