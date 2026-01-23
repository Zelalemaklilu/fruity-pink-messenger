import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Video, PhoneCall, PhoneIncoming, PhoneMissed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCall } from "@/contexts/CallContext";
import { toast } from "sonner";

interface CallLog {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  type: "incoming" | "outgoing" | "missed";
  callType: "voice" | "video";
  timestamp: Date;
  duration?: number;
}

// For now, we'll use local storage to persist call logs
// In production, you'd store these in Supabase
const CALL_LOGS_KEY = 'zeshopp_call_logs';

const getCallLogs = (): CallLog[] => {
  try {
    const stored = localStorage.getItem(CALL_LOGS_KEY);
    if (stored) {
      const logs = JSON.parse(stored);
      return logs.map((log: CallLog) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    }
  } catch (err) {
    console.error('Failed to load call logs:', err);
  }
  return [];
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimestamp = (date: Date): string => {
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
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [contacts, setContacts] = useState<Map<string, { name: string; avatar_url?: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load call logs and enrich with contact info
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const logs = getCallLogs();
      setCallLogs(logs);

      // Get unique peer IDs
      const peerIds = [...new Set(logs.map(log => log.peerId))];
      
      if (peerIds.length > 0) {
        // Fetch profiles for these peers
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', peerIds);

        if (profiles) {
          const contactMap = new Map<string, { name: string; avatar_url?: string }>();
          profiles.forEach(p => {
            contactMap.set(p.id, { name: p.name || 'Unknown', avatar_url: p.avatar_url || undefined });
          });
          setContacts(contactMap);
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const getCallIcon = (type: string, callType: string) => {
    if (type === "missed") {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    } else if (type === "incoming") {
      return <PhoneIncoming className="h-4 w-4 text-call-accept" />;
    } else {
      return callType === "video" ? 
        <Video className="h-4 w-4 text-primary" /> : 
        <PhoneCall className="h-4 w-4 text-call-accept" />;
    }
  };

  const handleCallClick = async (log: CallLog) => {
    if (!isReady) {
      toast.error('Call system not ready');
      return;
    }

    if (callState !== 'idle') {
      toast.error('Already in a call');
      return;
    }

    const contact = contacts.get(log.peerId);
    await startCall(
      log.peerId, 
      contact?.name || log.peerName, 
      log.callType, 
      contact?.avatar_url || log.peerAvatar
    );
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
            const contact = contacts.get(log.peerId);
            const displayName = contact?.name || log.peerName;
            const displayAvatar = contact?.avatar_url || log.peerAvatar;

            return (
              <div
                key={log.id}
                className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-all"
              >
                <ChatAvatar
                  name={displayName}
                  src={displayAvatar}
                  size="md"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-semibold truncate ${log.type === 'missed' ? 'text-destructive' : 'text-foreground'}`}>
                      {displayName}
                    </h3>
                    {getCallIcon(log.type, log.callType)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </p>
                    {log.duration && (
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(log.duration)}
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
                  {log.callType === "video" ? 
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
