import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCall } from '@/contexts/CallContext';
import { CallType } from '@/hooks/useWebRTC';
import { toast } from 'sonner';

interface CallButtonProps {
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export const CallButton = ({
  peerId,
  peerName,
  peerAvatar,
  variant = 'dropdown',
  className,
}: CallButtonProps) => {
  const { startCall, callState, isReady } = useCall();

  const handleCall = async (callType: CallType) => {
    if (!isReady) {
      toast.error('Call system not ready');
      return;
    }

    if (callState !== 'idle') {
      toast.error('Already in a call');
      return;
    }

    try {
      await startCall(peerId, peerName, callType, peerAvatar);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start call');
    }
  };

  if (variant === 'icon') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCall('voice')}
          disabled={callState !== 'idle'}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCall('video')}
          disabled={callState !== 'idle'}
        >
          <Video className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={callState !== 'idle'}
          className={className}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleCall('voice')}>
          <Phone className="h-4 w-4 mr-2" />
          Voice Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCall('video')}>
          <Video className="h-4 w-4 mr-2" />
          Video Call
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
