import { useState } from "react";
import { ArrowLeft, Bell, BellOff, Volume2, VolumeX, Vibrate, MessageSquare, Users, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PRESET_SOUNDS, playSound } from "@/lib/notificationSoundService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const SETTINGS_KEY = "zeshopp_notification_settings";

interface NotificationSettingsData {
  messageNotifications: boolean;
  messagePreview: boolean;
  messageSoundId: string;
  vibrate: boolean;
  groupNotifications: boolean;
  groupSoundId: string;
  callNotifications: boolean;
  ringtoneSoundId: string;
}

function loadSettings(): NotificationSettingsData {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...getDefaults(), ...JSON.parse(stored) };
  } catch {}
  return getDefaults();
}

function getDefaults(): NotificationSettingsData {
  return {
    messageNotifications: true,
    messagePreview: true,
    messageSoundId: "default",
    vibrate: true,
    groupNotifications: true,
    groupSoundId: "default",
    callNotifications: true,
    ringtoneSoundId: "default",
  };
}

function saveSettings(settings: NotificationSettingsData) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettingsData>(loadSettings);
  const [showMessageSoundPicker, setShowMessageSoundPicker] = useState(false);
  const [showGroupSoundPicker, setShowGroupSoundPicker] = useState(false);
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    requestPermission: enablePush,
    unsubscribe: disablePush,
  } = usePushNotifications();

  const update = (partial: Partial<NotificationSettingsData>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  };

  const getSoundName = (id: string) => PRESET_SOUNDS.find((s) => s.id === id)?.name || "Default";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="px-4 pt-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Messages</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                {settings.messageNotifications ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div>
                <span className="font-medium text-foreground">Message Notifications</span>
                <p className="text-xs text-muted-foreground">Get notified for new messages</p>
              </div>
            </div>
            <Switch
              checked={settings.messageNotifications}
              onCheckedChange={(v) => update({ messageNotifications: v })}
              data-testid="switch-message-notifications"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Message Preview</span>
                <p className="text-xs text-muted-foreground">Show preview in notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.messagePreview}
              onCheckedChange={(v) => update({ messagePreview: v })}
              data-testid="switch-message-preview"
            />
          </div>
        </Card>

        <Dialog open={showMessageSoundPicker} onOpenChange={setShowMessageSoundPicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth" data-testid="button-message-sound">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-primary">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Message Sound</span>
                  <p className="text-xs text-muted-foreground">{getSoundName(settings.messageSoundId)}</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Message Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {PRESET_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  data-testid={`select-message-sound-${sound.id}`}
                  onClick={() => {
                    playSound(sound);
                    update({ messageSoundId: sound.id });
                    toast.success(`Sound: ${sound.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.messageSoundId === sound.id ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium text-foreground">{sound.name}</span>
                  {settings.messageSoundId === sound.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Vibrate className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Vibrate</span>
                <p className="text-xs text-muted-foreground">Vibrate on new messages</p>
              </div>
            </div>
            <Switch
              checked={settings.vibrate}
              onCheckedChange={(v) => update({ vibrate: v })}
              data-testid="switch-vibrate"
            />
          </div>
        </Card>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Groups</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-foreground">Group Notifications</span>
                <p className="text-xs text-muted-foreground">Notifications for group messages</p>
              </div>
            </div>
            <Switch
              checked={settings.groupNotifications}
              onCheckedChange={(v) => update({ groupNotifications: v })}
              data-testid="switch-group-notifications"
            />
          </div>
        </Card>

        <Dialog open={showGroupSoundPicker} onOpenChange={setShowGroupSoundPicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth" data-testid="button-group-sound">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-primary">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Group Sound</span>
                  <p className="text-xs text-muted-foreground">{getSoundName(settings.groupSoundId)}</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Group Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {PRESET_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  data-testid={`select-group-sound-${sound.id}`}
                  onClick={() => {
                    playSound(sound);
                    update({ groupSoundId: sound.id });
                    toast.success(`Sound: ${sound.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.groupSoundId === sound.id ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium text-foreground">{sound.name}</span>
                  {settings.groupSoundId === sound.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Calls</h3>

        {pushSupported && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-primary">
                  {pushSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                </div>
                <div>
                  <span className="font-medium text-foreground">Call Notifications</span>
                  <p className="text-xs text-muted-foreground">Get notified for incoming calls</p>
                </div>
              </div>
              <Switch
                checked={pushSubscribed}
                disabled={pushLoading}
                onCheckedChange={(checked) => (checked ? enablePush() : disablePush())}
                data-testid="switch-call-notifications"
              />
            </div>
          </Card>
        )}

        <Dialog open={showRingtonePicker} onOpenChange={setShowRingtonePicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth" data-testid="button-ringtone">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Ringtone</span>
                  <p className="text-xs text-muted-foreground">{getSoundName(settings.ringtoneSoundId)}</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Ringtone</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {PRESET_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  data-testid={`select-ringtone-${sound.id}`}
                  onClick={() => {
                    playSound(sound);
                    update({ ringtoneSoundId: sound.id });
                    toast.success(`Ringtone: ${sound.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.ringtoneSoundId === sound.id ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium text-foreground">{sound.name}</span>
                  {settings.ringtoneSoundId === sound.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-16" />
    </div>
  );
};

export default NotificationSettings;
