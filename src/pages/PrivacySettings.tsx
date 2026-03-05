import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, UserX, Users, Phone, Forward, Shield, Ghost, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { getPrivacySettings, updatePrivacySettings, type PrivacySettings as PrivacySettingsType } from "@/lib/privacyService";
import { getBlockedUsers, unblockUser } from "@/lib/blockService";
import { getGhostMode, setGhostMode, type GhostModeSettings } from "@/lib/ghostModeService";
import { isAppLockEnabled, setAppLock, removeAppLock, verifyAppPin } from "@/lib/chatLockService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockedProfile {
  id: string;
  name: string | null;
  username: string;
  avatar_url: string | null;
}

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySettingsType>(getPrivacySettings());
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [unblockTarget, setUnblockTarget] = useState<BlockedProfile | null>(null);
  const [ghostSettings, setGhostSettings] = useState<GhostModeSettings>(getGhostMode());
  const [appLockEnabled, setAppLockEnabled] = useState(isAppLockEnabled());
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");

  useEffect(() => {
    loadBlockedProfiles();
  }, []);

  const loadBlockedProfiles = async () => {
    setLoadingBlocked(true);
    const blockedIds = getBlockedUsers();
    if (blockedIds.length === 0) {
      setBlockedProfiles([]);
      setLoadingBlocked(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .in("id", blockedIds);
    if (data) {
      setBlockedProfiles(data as BlockedProfile[]);
    }
    setLoadingBlocked(false);
  };

  const handleUpdate = (updates: Partial<PrivacySettingsType>) => {
    const updated = updatePrivacySettings(updates);
    setSettings(updated);
    toast.success("Privacy settings updated");
  };

  const handleGhostUpdate = (updates: Partial<GhostModeSettings>) => {
    const updated = setGhostMode(updates);
    setGhostSettings(updated);
    toast.success(updates.enabled !== undefined 
      ? (updates.enabled ? "Ghost Mode enabled" : "Ghost Mode disabled")
      : "Ghost Mode updated");
  };

  const handleUnblock = (profile: BlockedProfile) => {
    unblockUser(profile.id);
    setBlockedProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setUnblockTarget(null);
    toast.success(`${profile.name || profile.username} unblocked`);
  };

  const handleSetAppLock = () => {
    if (pinStep === "enter") {
      if (pinInput.length < 4) {
        toast.error("PIN must be at least 4 digits");
        return;
      }
      setPinStep("confirm");
      setPinConfirm("");
    } else {
      if (pinInput !== pinConfirm) {
        toast.error("PINs don't match");
        setPinConfirm("");
        setPinStep("enter");
        setPinInput("");
        return;
      }
      setAppLock(pinInput);
      setAppLockEnabled(true);
      setShowPinDialog(false);
      setPinInput("");
      setPinConfirm("");
      setPinStep("enter");
      toast.success("App lock enabled");
    }
  };

  const handleRemoveAppLock = () => {
    removeAppLock();
    setAppLockEnabled(false);
    toast.success("App lock removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy & Security</h1>
        </div>
      </div>

      {/* Ghost Mode Section */}
      <div className="px-4 pt-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ghost Mode</h3>

        <Card className="p-4 border-primary/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Ghost className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Ghost Mode</span>
                <p className="text-xs text-muted-foreground">Read messages invisibly</p>
              </div>
            </div>
            <Switch
              checked={ghostSettings.enabled}
              onCheckedChange={(val) => handleGhostUpdate({ enabled: val })}
            />
          </div>
        </Card>

        {ghostSettings.enabled && (
          <div className="space-y-2 pl-2">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hide Read Receipts</span>
                </div>
                <Switch
                  checked={ghostSettings.hideReadReceipts}
                  onCheckedChange={(val) => handleGhostUpdate({ hideReadReceipts: val })}
                />
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hide Typing Indicator</span>
                </div>
                <Switch
                  checked={ghostSettings.hideTyping}
                  onCheckedChange={(val) => handleGhostUpdate({ hideTyping: val })}
                />
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hide Online Status</span>
                </div>
                <Switch
                  checked={ghostSettings.hideOnlineStatus}
                  onCheckedChange={(val) => handleGhostUpdate({ hideOnlineStatus: val })}
                />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* App Lock Section */}
      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">App Lock</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">PIN Lock</span>
                <p className="text-xs text-muted-foreground">Lock chats with a PIN code</p>
              </div>
            </div>
            {appLockEnabled ? (
              <Button variant="outline" size="sm" onClick={handleRemoveAppLock}>Remove</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setShowPinDialog(true); setPinStep("enter"); setPinInput(""); }}>Set PIN</Button>
            )}
          </div>
        </Card>
      </div>

      {/* Privacy Controls */}
      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Privacy Controls</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Last Seen</span>
                <p className="text-xs text-muted-foreground">Who can see your last seen</p>
              </div>
            </div>
            <Select
              value={settings.lastSeenVisibility}
              onValueChange={(val) => handleUpdate({ lastSeenVisibility: val as "everyone" | "contacts" | "nobody" })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="nobody">Nobody</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Read Receipts</span>
                <p className="text-xs text-muted-foreground">Show when you've read messages</p>
              </div>
            </div>
            <Switch
              checked={settings.readReceipts}
              onCheckedChange={(val) => handleUpdate({ readReceipts: val })}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Online Status</span>
                <p className="text-xs text-muted-foreground">Show when you're online</p>
              </div>
            </div>
            <Switch
              checked={settings.onlineStatus}
              onCheckedChange={(val) => handleUpdate({ onlineStatus: val })}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Profile Photo</span>
                <p className="text-xs text-muted-foreground">Who can see your profile photo</p>
              </div>
            </div>
            <Select
              value={settings.profilePhotoVisibility}
              onValueChange={(val) => handleUpdate({ profilePhotoVisibility: val as "everyone" | "contacts" | "nobody" })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="nobody">Nobody</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Forward className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Forwarded Messages</span>
                <p className="text-xs text-muted-foreground">Show "Forwarded from" label</p>
              </div>
            </div>
            <Switch
              checked={settings.forwardedMessages}
              onCheckedChange={(val) => handleUpdate({ forwardedMessages: val })}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Phone Number</span>
                <p className="text-xs text-muted-foreground">Who can see your phone number</p>
              </div>
            </div>
            <Select
              value={settings.phoneNumberVisibility}
              onValueChange={(val) => handleUpdate({ phoneNumberVisibility: val as "everyone" | "contacts" | "nobody" })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="nobody">Nobody</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Groups</span>
                <p className="text-xs text-muted-foreground">Who can add you to groups</p>
              </div>
            </div>
            <Select
              value={settings.groupsAddPermission}
              onValueChange={(val) => handleUpdate({ groupsAddPermission: val as "everyone" | "contacts" })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Blocked Users */}
      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Blocked Users</h3>

        {loadingBlocked ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          </Card>
        ) : blockedProfiles.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-2">
              <UserX className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No blocked users</p>
            </div>
          </Card>
        ) : (
          blockedProfiles.map((profile) => (
            <Card key={profile.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.name || profile.username} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(profile.name || profile.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{profile.name || profile.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 flex-shrink-0"
                  onClick={() => setUnblockTarget(profile)}
                >
                  Unblock
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="h-16" />

      {/* Unblock Dialog */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {unblockTarget?.name || unblockTarget?.username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unblockTarget && handleUnblock(unblockTarget)}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIN Setup Dialog */}
      <Dialog open={showPinDialog} onOpenChange={(open) => { if (!open) { setShowPinDialog(false); setPinInput(""); setPinConfirm(""); setPinStep("enter"); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pinStep === "enter" ? "Set PIN" : "Confirm PIN"}</DialogTitle>
            <DialogDescription>
              {pinStep === "enter" ? "Enter a 4-digit PIN to lock your chats" : "Re-enter your PIN to confirm"}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            value={pinStep === "enter" ? pinInput : pinConfirm}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              pinStep === "enter" ? setPinInput(val) : setPinConfirm(val);
            }}
            className="text-center text-2xl tracking-[1em] font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>Cancel</Button>
            <Button onClick={handleSetAppLock}>
              {pinStep === "enter" ? "Next" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySettings;