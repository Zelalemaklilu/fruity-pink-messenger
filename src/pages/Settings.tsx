import { useState, useEffect } from "react";
import { ArrowLeft, User, Wallet, Users, BookOpen, Phone, Bookmark, Settings as SettingsIcon, Share, Star, LogOut, Plus, Check, Loader2, Bell, BellOff, Sun, Moon, Palette, Volume2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { getProfile, Profile } from "@/lib/supabaseService";
import { signOut } from "@/lib/supabaseAuth";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ACCENT_COLORS, getAccentColor, setAccentColor } from "@/lib/profileCustomizationService";
import { PRESET_SOUNDS, getDefaultSound, setDefaultSound, playSound } from "@/lib/notificationSoundService";
import { getPresetWallpapers, setDefaultWallpaper, getDefaultWallpaper, getWallpaperStyle, type WallpaperConfig } from "@/lib/chatWallpaperService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState(getAccentColor().id);
  const [currentSound, setCurrentSound] = useState(getDefaultSound().id);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    requestPermission: enablePush,
    unsubscribe: disablePush,
  } = usePushNotifications();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) setLoading(true);
      try {
        const userProfile = await getProfile(user.id);
        if (mounted) setProfile(userProfile);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Failed to log out");
      setLoggingOut(false);
    }
  };

  const handleMenuClick = (label: string) => {
    switch(label) {
      case "My Profile": navigate('/profile'); break;
      case "Wallet": navigate('/wallet'); break;
      case "New Group": navigate('/new-group'); break;
      case "Contacts": navigate('/contacts'); break;
      case "Calls": navigate('/calls'); break;
      case "Saved Messages": navigate('/saved-messages'); break;
      case "Settings": break;
      case "Invite Friends":
        navigator.share?.({
          title: 'Join me on Zeshopp Chat',
          text: 'Fast, simple, and secure messaging app',
          url: window.location.origin
        }) || alert('Share: ' + window.location.origin);
        break;
      case "Zeshopp Features": navigate('/features'); break;
      default: break;
    }
  };

  const menuItems = [
    { icon: User, label: "My Profile", color: "text-primary" },
    { icon: Wallet, label: "Wallet", color: "text-green-500" },
    { icon: Users, label: "New Group", color: "text-blue-500" },
    { icon: BookOpen, label: "Contacts", color: "text-orange-500" },
    { icon: Phone, label: "Calls", color: "text-purple-500" },
    { icon: Bookmark, label: "Saved Messages", color: "text-yellow-500" },
    { icon: SettingsIcon, label: "Settings", color: "text-gray-500" },
    { icon: Share, label: "Invite Friends", color: "text-cyan-500" },
    { icon: Star, label: "Zeshopp Features", color: "text-primary" },
  ];

  const wallpapers = getPresetWallpapers();
  const currentWallpaper = getDefaultWallpaper();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4">
        <Card className="p-6 space-y-4 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Account</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : profile ? (
            <div 
              className="flex items-center space-x-4 p-3 rounded-lg border border-primary bg-primary/5 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-12 w-12 border border-primary/20">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.name || ''} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {(profile.name || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{profile.name || 'User'}</h4>
                <p className="text-primary text-sm font-medium">@{profile.username}</p>
                <p className="text-muted-foreground text-xs">{profile.email}</p>
              </div>
              <Check className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Not logged in</p>
          )}
        </Card>
      </div>

      {/* Appearance Section */}
      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Appearance</h3>
        
        {/* Theme Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-muted text-primary">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
                <p className="text-xs text-muted-foreground">Toggle app theme</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </Card>

        {/* Accent Color */}
        <Dialog open={showAccentPicker} onOpenChange={setShowAccentPicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Accent Color</span>
                    <p className="text-xs text-muted-foreground">{getAccentColor().name}</p>
                  </div>
                </div>
                <div 
                  className="w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-background ring-primary" 
                  style={{ backgroundColor: `hsl(${getAccentColor().hsl})` }}
                />
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Choose Accent Color</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setAccentColor(color.id);
                    setCurrentAccent(color.id);
                    toast.success(`Accent: ${color.name}`);
                    setShowAccentPicker(false);
                  }}
                  className="flex flex-col items-center space-y-2"
                >
                  <div
                    className={`w-12 h-12 rounded-full transition-transform ${
                      currentAccent === color.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: `hsl(${color.hsl})` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{color.name}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Chat Wallpaper */}
        <Dialog open={showWallpaperPicker} onOpenChange={setShowWallpaperPicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Chat Wallpaper</span>
                  <p className="text-xs text-muted-foreground">Default chat background</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Chat Wallpaper</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {wallpapers.map((wp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDefaultWallpaper(wp);
                    toast.success("Wallpaper set!");
                    setShowWallpaperPicker(false);
                  }}
                  className={`aspect-[3/4] rounded-lg border-2 transition-transform hover:scale-105 ${
                    JSON.stringify(currentWallpaper) === JSON.stringify(wp) ? 'border-primary' : 'border-border'
                  }`}
                  style={{
                    ...getWallpaperStyle(wp),
                    backgroundColor: wp.value === 'transparent' ? 'hsl(var(--background))' : undefined,
                  }}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications Section */}
      <div className="px-4 mb-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Notifications</h3>
        
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
                onCheckedChange={(checked) => checked ? enablePush() : disablePush()}
              />
            </div>
          </Card>
        )}

        {/* Notification Sound */}
        <Dialog open={showSoundPicker} onOpenChange={setShowSoundPicker}>
          <DialogTrigger asChild>
            <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Notification Sound</span>
                  <p className="text-xs text-muted-foreground">{getDefaultSound().name}</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Notification Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {PRESET_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    playSound(sound);
                    setDefaultSound(sound.id);
                    setCurrentSound(sound.id);
                    toast.success(`Sound: ${sound.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    currentSound === sound.id ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium text-foreground">{sound.name}</span>
                  {currentSound === sound.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Menu</h3>
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth"
            onClick={() => handleMenuClick(item.label)}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-foreground">{item.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Logout Section */}
      <div className="p-4">
        <Card className="p-4">
          <Button
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 mr-3" />
            )}
            {loggingOut ? "Logging out..." : "Log Out"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
