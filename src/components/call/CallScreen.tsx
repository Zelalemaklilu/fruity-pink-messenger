import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAvatar } from '@/components/ui/chat-avatar';
import { useCall } from '@/contexts/CallContext';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const CallScreen = () => {
  const {
    callState,
    activeCall,
    callDuration,
    isMuted,
    isCameraOff,
    errorMessage,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleCamera,
    resetCall,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video/audio element
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isVideoCall = activeCall.callType === 'video';
  const isConnecting = callState === 'outgoing_calling' || callState === 'connecting';
  const isInCall = callState === 'in_call';
  const isEnded = callState === 'call_ended' || callState === 'call_failed' || callState === 'rejected' || callState === 'missed';

  const getStatusText = (): string => {
    switch (callState) {
      case 'outgoing_calling':
        return 'Calling...';
      case 'connecting':
        return 'Connecting...';
      case 'in_call':
        return formatDuration(callDuration);
      case 'call_ended':
        return 'Call ended';
      case 'call_failed':
        return errorMessage || 'Call failed';
      case 'rejected':
        return 'Call rejected';
      case 'missed':
        return 'Missed call';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Remote audio (always present for audio playback) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Main content area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Remote video or avatar */}
        {isVideoCall && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center">
            {/* Animated rings for connecting state */}
            <div className="relative mb-6">
              {isConnecting && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150" />
                  <div className="absolute inset-0 animate-pulse rounded-full bg-primary/30 scale-125" />
                </>
              )}
              <ChatAvatar
                name={activeCall.peerName}
                src={activeCall.peerAvatar}
                size="xl"
                className="relative z-10 w-32 h-32"
              />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {activeCall.peerName}
            </h2>

            <div className="flex items-center gap-2 text-muted-foreground">
              {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className={isEnded && callState !== 'call_ended' ? 'text-destructive' : ''}>
                {getStatusText()}
              </span>
            </div>
          </div>
        )}

        {/* Local video preview (for video calls) */}
        {isVideoCall && localStream && (
          <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden bg-muted shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
            />
            {isCameraOff && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Status overlay for video calls */}
        {isVideoCall && remoteStream && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded-lg px-4 py-2">
            <p className="text-sm font-medium">{activeCall.peerName}</p>
            <p className="text-xs text-muted-foreground">{getStatusText()}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-background to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Mute button */}
          {!isEnded && (
            <Button
              size="lg"
              variant={isMuted ? 'destructive' : 'secondary'}
              className="w-14 h-14 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          )}

          {/* End call / Close button */}
          <Button
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full"
            onClick={isEnded ? resetCall : endCall}
          >
            {isEnded ? (
              <Phone className="h-7 w-7" />
            ) : (
              <PhoneOff className="h-7 w-7" />
            )}
          </Button>

          {/* Camera toggle (video calls only) */}
          {isVideoCall && !isEnded && (
            <Button
              size="lg"
              variant={isCameraOff ? 'destructive' : 'secondary'}
              className="w-14 h-14 rounded-full"
              onClick={toggleCamera}
            >
              {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
