import { useState, useEffect } from "react";
import { ArrowLeft, User, Wallet, Users, BookOpen, Phone, Bookmark, Settings as SettingsIcon, Share, Star, LogOut, Plus, Check, Loader2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { getProfile, Profile } from "@/lib/supabaseService";
import { signOut } from "@/lib/supabaseAuth";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getSessionUserSafe } from "@/lib/authSession";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    requestPermission: enablePush,
    unsubscribe: disablePush,
  } = usePushNotifications();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { user } = await getSessionUserSafe();
      
      if (user) {
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
      case "My Profile":
        navigate('/profile');
        break;
      case "Wallet":
        navigate('/wallet');
        break;
      case "New Group":
        navigate('/new-group');
        break;
      case "Contacts":
        navigate('/contacts');
        break;
      case "Calls":
        navigate('/calls');
        break;
      case "Saved Messages":
        navigate('/saved-messages');
        break;
      case "Settings":
        break;
      case "Invite Friends":
        navigator.share?.({
          title: 'Join me on Zeshopp Chat',
          text: 'Fast, simple, and secure messaging app',
          url: window.location.origin
        }) || alert('Share: ' + window.location.origin);
        break;
      case "Zeshopp Features":
        navigate('/features');
        break;
      default:
        break;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/chats")}
          >
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
                <h4 className="font-semibold text-foreground">
                  {profile.name || 'User'}
                </h4>
                <p className="text-primary text-sm font-medium">
                  @{profile.username}
                </p>
                <p className="text-muted-foreground text-xs">
                  {profile.email}
                </p>
              </div>

              <Check className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Not logged in</p>
          )}
        </Card>
      </div>

      {/* Notification Settings */}
      {pushSupported && (
        <div className="px-4 mb-4">
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
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 space-y-2">
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
