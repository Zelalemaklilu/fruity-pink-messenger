import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Video, PhoneCall, PhoneIncoming, PhoneMissed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCall } from "@/contexts/CallContext";
import { callLogService, CallLogWithProfile } from "@/lib/callLogService";
import { toast } from "sonner";

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimestamp = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
  }
};

const Calls = () => {
  const navigate = useNavigate();
  const { startCall, callState, isReady } = useCall();
  const [callLogs, setCallLogs] = useState<CallLogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load call logs from database
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const logs = await callLogService.getCallLogs(50);
        setCallLogs(logs);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Subscribe to new call logs
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = callLogService.subscribeToCallLogs(currentUserId, (newLog) => {
      // Refresh call logs when a new one arrives
      callLogService.getCallLogs(50).then(setCallLogs);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId]);

  const getCallIcon = (log: CallLogWithProfile) => {
    const isOutgoing = log.caller_id === currentUserId;
    
    if (log.status === "missed" || log.status === "rejected") {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    } else if (!isOutgoing) {
      return <PhoneIncoming className="h-4 w-4 text-call-accept" />;
    } else {
      return log.call_type === "video" ? 
        <Video className="h-4 w-4 text-primary" /> : 
        <PhoneCall className="h-4 w-4 text-call-accept" />;
    }
  };

  const getCallTypeLabel = (log: CallLogWithProfile): string => {
    const isOutgoing = log.caller_id === currentUserId;
    
    if (log.status === "missed") return "Missed";
    if (log.status === "rejected") return "Declined";
    if (log.status === "failed") return "Failed";
    return isOutgoing ? "Outgoing" : "Incoming";
  };

  const handleCallClick = async (log: CallLogWithProfile) => {
    if (!isReady) {
      toast.error('Call system not ready');
      return;
    }

    if (callState !== 'idle') {
      toast.error('Already in a call');
      return;
    }

    // Determine who to call (the other person in the call)
    const isOutgoing = log.caller_id === currentUserId;
    const peerId = isOutgoing ? log.receiver_id : log.caller_id;
    const peerProfile = isOutgoing ? log.receiver_profile : log.caller_profile;

    await startCall(
      peerId, 
      peerProfile?.name || 'Unknown', 
      log.call_type, 
      peerProfile?.avatar_url || undefined
    );
  };

  const getPeerInfo = (log: CallLogWithProfile) => {
    const isOutgoing = log.caller_id === currentUserId;
    const peerProfile = isOutgoing ? log.receiver_profile : log.caller_profile;
    return {
      name: peerProfile?.name || 'Unknown',
      avatar: peerProfile?.avatar_url || undefined,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Calls</h1>
        </div>
      </div>

      {/* Empty state */}
      {callLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Phone className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No calls yet</h2>
          <p className="text-muted-foreground max-w-xs">
            Start a voice or video call with your contacts. Your call history will appear here.
          </p>
        </div>
      ) : (
        /* Calls List */
        <div className="divide-y divide-border">
          {callLogs.map((log) => {
            const peer = getPeerInfo(log);
            const isMissedOrRejected = log.status === 'missed' || log.status === 'rejected';

            return (
              <div
                key={log.id}
                className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-all"
              >
                <ChatAvatar
                  name={peer.name}
                  src={peer.avatar}
                  size="md"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold truncate ${isMissedOrRejected ? 'text-destructive' : 'text-foreground'}`}>
                      {peer.name}
                    </h3>
                    {getCallIcon(log)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      {getCallTypeLabel(log)} • {formatTimestamp(log.created_at)}
                    </p>
                    {log.duration_seconds && log.duration_seconds > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(log.duration_seconds)}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCallClick(log)}
                  className="text-primary hover:text-primary/80"
                  disabled={callState !== 'idle'}
                >
                  {log.call_type === "video" ? 
                    <Video className="h-5 w-5" /> : 
                    <Phone className="h-5 w-5" />
                  }
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Calls;
