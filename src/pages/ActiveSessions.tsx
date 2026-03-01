import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Tablet, Globe, X, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getDeviceSessions,
  registerDevice,
  terminateSession,
  terminateAllOtherSessions,
  type DeviceSession,
} from "@/lib/deviceService";
import { formatDistanceToNow } from "date-fns";

const DeviceIcon = ({ type }: { type: DeviceSession["deviceType"] }) => {
  switch (type) {
    case "desktop":
      return <Monitor className="h-5 w-5" />;
    case "mobile":
      return <Smartphone className="h-5 w-5" />;
    case "tablet":
      return <Tablet className="h-5 w-5" />;
    case "web":
      return <Globe className="h-5 w-5" />;
    default:
      return <Globe className="h-5 w-5" />;
  }
};

interface SessionCardProps {
  session: DeviceSession;
  onTerminate: () => void;
}

const SessionCard = ({ session, onTerminate }: SessionCardProps) => {
  const lastActiveText = formatDistanceToNow(new Date(session.lastActive), { addSuffix: true });

  return (
    <Card className="p-4" data-testid={`session-card-${session.id}`}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          session.isCurrent ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground",
        )}>
          <DeviceIcon type={session.deviceType} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">{session.deviceName}</span>
            {session.isCurrent && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">
                This device
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{session.os}</p>
          <p className="text-xs text-muted-foreground">IP: {session.ipAddress}</p>
          <p className="text-xs text-muted-foreground">{session.location}</p>
          <p className="text-xs text-muted-foreground">
            {session.isCurrent ? "Active now" : `Last active ${lastActiveText}`}
          </p>
        </div>
        {!session.isCurrent && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive flex-shrink-0"
            onClick={onTerminate}
            data-testid={`button-terminate-session-${session.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

const ActiveSessions = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [showTerminateSingle, setShowTerminateSingle] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    registerDevice(userId);
    setSessions(getDeviceSessions(userId));
  }, [userId]);

  const handleTerminate = (sessionId: string) => {
    if (!userId) return;
    terminateSession(userId, sessionId);
    setSessions(getDeviceSessions(userId));
    toast.success("Session terminated");
    setShowTerminateSingle(null);
  };

  const handleTerminateAll = () => {
    if (!userId) return;
    const count = terminateAllOtherSessions(userId);
    setSessions(getDeviceSessions(userId));
    toast.success(`${count} session${count !== 1 ? "s" : ""} terminated`);
    setShowTerminateAll(false);
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="button-back-sessions">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Active Sessions</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3 px-1">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across all devices. You can terminate sessions you don't recognize.
          </p>
        </div>

        {currentSession && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Current Session
            </h3>
            <SessionCard session={currentSession} onTerminate={() => {}} />
          </div>
        )}

        {otherSessions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Other Sessions ({otherSessions.length})
            </h3>
            {otherSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onTerminate={() => setShowTerminateSingle(session.id)}
              />
            ))}
          </div>
        )}

        {otherSessions.length > 0 && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowTerminateAll(true)}
            data-testid="button-terminate-all-sessions"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Terminate All Other Sessions
          </Button>
        )}

        {otherSessions.length === 0 && (
          <Card className="p-6">
            <p className="text-center text-muted-foreground text-sm">
              No other active sessions
            </p>
          </Card>
        )}
      </div>

      <AlertDialog open={showTerminateAll} onOpenChange={setShowTerminateAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out from all other devices. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-terminate-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateAll}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-terminate-all"
            >
              Terminate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!showTerminateSingle} onOpenChange={() => setShowTerminateSingle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out from this device. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-terminate-single">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showTerminateSingle && handleTerminate(showTerminateSingle)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-terminate-single"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActiveSessions;
