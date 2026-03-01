import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, UserX, Users, Phone, Forward, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { getPrivacySettings, updatePrivacySettings, type PrivacySettings as PrivacySettingsType } from "@/lib/privacyService";
import { getBlockedUsers, unblockUser } from "@/lib/blockService";
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

  const handleUnblock = (profile: BlockedProfile) => {
    unblockUser(profile.id);
    setBlockedProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setUnblockTarget(null);
    toast.success(`${profile.name || profile.username} unblocked`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="button-back-privacy">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy & Security</h1>
        </div>
      </div>

      <div className="px-4 pt-4 mb-4 space-y-2">
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
              <SelectTrigger className="w-[130px]" data-testid="select-last-seen">
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
              data-testid="switch-read-receipts"
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
              data-testid="switch-online-status"
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
              <SelectTrigger className="w-[130px]" data-testid="select-profile-photo">
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
              data-testid="switch-forwarded-messages"
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
              <SelectTrigger className="w-[130px]" data-testid="select-phone-number">
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
              <SelectTrigger className="w-[130px]" data-testid="select-groups">
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
              <p className="text-sm text-muted-foreground" data-testid="text-no-blocked-users">No blocked users</p>
            </div>
          </Card>
        ) : (
          blockedProfiles.map((profile) => (
            <Card key={profile.id} className="p-4" data-testid={`card-blocked-user-${profile.id}`}>
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
                  data-testid={`button-unblock-${profile.id}`}
                >
                  Unblock
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="h-16" />

      <AlertDialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {unblockTarget?.name || unblockTarget?.username}? They will be able to message you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unblock">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockTarget && handleUnblock(unblockTarget)}
              data-testid="button-confirm-unblock"
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrivacySettings;
