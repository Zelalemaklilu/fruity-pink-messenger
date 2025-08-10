import { useState } from "react";
import { ArrowLeft, Phone, Video, PhoneCall, PhoneIncoming, PhoneMissed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Call {
  id: string;
  name: string;
  type: "incoming" | "outgoing" | "missed";
  callType: "voice" | "video";
  timestamp: string;
  duration?: string;
  avatar?: string;
}

const mockCalls: Call[] = [
  {
    id: "1",
    name: "Alex Johnson",
    type: "incoming",
    callType: "voice",
    timestamp: "Today, 2:30 PM",
    duration: "5:23"
  },
  {
    id: "2",
    name: "Sarah Williams",
    type: "outgoing", 
    callType: "video",
    timestamp: "Today, 1:15 PM",
    duration: "12:45"
  },
  {
    id: "3",
    name: "John Smith",
    type: "missed",
    callType: "voice",
    timestamp: "Yesterday, 6:20 PM"
  },
  {
    id: "4",
    name: "Emma Davis",
    type: "outgoing",
    callType: "voice",
    timestamp: "Yesterday, 3:10 PM",
    duration: "2:15"
  }
];

const Calls = () => {
  const navigate = useNavigate();

  const getCallIcon = (type: string, callType: string) => {
    if (type === "missed") {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    } else if (type === "incoming") {
      return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    } else {
      return callType === "video" ? 
        <Video className="h-4 w-4 text-primary" /> : 
        <PhoneCall className="h-4 w-4 text-green-500" />;
    }
  };

  const handleCallClick = (call: Call) => {
    // Simulate making a call
    alert(`Calling ${call.name}...`);
  };

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

      {/* Calls List */}
      <div className="divide-y divide-border">
        {mockCalls.map((call) => (
          <div
            key={call.id}
            className="flex items-center space-x-3 p-4 hover:bg-muted/50 transition-smooth"
          >
            <ChatAvatar
              name={call.name}
              src={call.avatar}
              size="md"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground truncate">
                  {call.name}
                </h3>
                {getCallIcon(call.type, call.callType)}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {call.timestamp}
                </p>
                {call.duration && (
                  <Badge variant="secondary" className="text-xs">
                    {call.duration}
                  </Badge>
                )}
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleCallClick(call)}
              className="text-primary hover:text-primary/80"
            >
              {call.callType === "video" ? 
                <Video className="h-5 w-5" /> : 
                <Phone className="h-5 w-5" />
              }
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calls;