import { useState, useEffect, useCallback } from "react";
import { MapPin, Radio, Check, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  isNearbyVisible,
  setNearbyVisible,
  getNearbyUsers,
  generateMockNearbyUsers,
  sendConnectionRequest,
  getConnectionRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  type NearbyUser,
} from "@/lib/nearbyService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const NearbyPeople = () => {
  const { userId } = useAuth();
  const [visible, setVisible] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [requests, setRequests] = useState<
    Array<{ fromUserId: string; fromName: string; createdAt: string }>
  >([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      setVisible(isNearbyVisible(userId));
      setRequests(getConnectionRequests(userId));
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      setNearbyUsers(getNearbyUsers());
      setLastUpdated(Date.now());
    }
  }, [visible]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleToggleVisible = useCallback(
    (checked: boolean) => {
      if (!userId) return;
      setNearbyVisible(userId, checked);
      setVisible(checked);
      if (checked) {
        setNearbyUsers(getNearbyUsers());
        setLastUpdated(Date.now());
        toast.success("You are now visible to nearby people");
      } else {
        toast.success("You are now hidden");
      }
    },
    [userId]
  );

  const handleRefresh = useCallback(() => {
    const users = generateMockNearbyUsers();
    setNearbyUsers(users);
    setLastUpdated(Date.now());
    setSecondsAgo(0);
  }, []);

  const handleSayHi = useCallback(
    (toUser: NearbyUser) => {
      if (!userId) return;
      sendConnectionRequest(userId, toUser.userId);
      setSentRequests((prev) => new Set(prev).add(toUser.userId));
      toast.success(`Sent a Hi to ${toUser.name}`);
    },
    [userId]
  );

  const handleAccept = useCallback(
    (fromUserId: string) => {
      if (!userId) return;
      acceptConnectionRequest(userId, fromUserId);
      setRequests((prev) => prev.filter((r) => r.fromUserId !== fromUserId));
      toast.success("Connection accepted");
    },
    [userId]
  );

  const handleDecline = useCallback(
    (fromUserId: string) => {
      if (!userId) return;
      declineConnectionRequest(userId, fromUserId);
      setRequests((prev) => prev.filter((r) => r.fromUserId !== fromUserId));
      toast.success("Request declined");
    },
    [userId]
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatSecondsAgo = (s: number) => {
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    return `${m}m ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="page-nearby">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-50"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">People Nearby</h1>
        </div>
      </motion.div>

      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Make myself visible
              </p>
              <p className="text-xs text-muted-foreground">
                Let others nearby see you
              </p>
            </div>
          </div>
          <Switch
            checked={visible}
            onCheckedChange={handleToggleVisible}
            data-testid="switch-nearby-visible"
          />
        </div>

        {!visible && (
          <div className="flex flex-col items-center justify-center pt-16 gap-4 text-muted-foreground">
            <MapPin className="h-16 w-16 opacity-20" />
            <p className="text-sm text-center max-w-xs">
              Turn on visibility to discover people near you. Your location
              stays private and only approximate distances are shown.
            </p>
          </div>
        )}

        {visible && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Updated {formatSecondsAgo(secondsAgo)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                data-testid="button-refresh-nearby"
              >
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>

            {requests.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Connection Requests
                </h2>
                <div className="space-y-2">
                  {requests.map((req) => (
                    <motion.div
                      key={req.fromUserId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(req.fromName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {req.fromName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Wants to connect
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAccept(req.fromUserId)}
                          data-testid={`button-accept-${req.fromUserId}`}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDecline(req.fromUserId)}
                          data-testid={`button-decline-${req.fromUserId}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {nearbyUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-12 gap-4 text-muted-foreground">
                <MapPin className="h-14 w-14 opacity-20" />
                <p className="text-sm" data-testid="text-no-nearby">
                  No one nearby
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {nearbyUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                    data-testid={`card-nearby-${user.id}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {user.distance}
                        </Badge>
                      </div>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSayHi(user)}
                      disabled={sentRequests.has(user.userId)}
                      data-testid={`button-sayhi-${user.id}`}
                    >
                      {sentRequests.has(user.userId) ? "Sent" : "Say Hi"}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NearbyPeople;
