import { useState, useEffect } from "react";
import { ArrowLeft, User, Wallet, Users, BookOpen, Phone, Bookmark, Settings as SettingsIcon, Share, Star, LogOut, Plus, Check, Loader2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { getAccountsByUserId, setActiveAccount, Account } from "@/lib/firestoreService";
import { logOut } from "@/lib/firebaseAuth";
import { toast } from "sonner";
import { requestNotificationPermission, getNotificationPermissionStatus, isNotificationSupported, onForegroundMessage, initializeMessaging } from "@/lib/firebaseMessaging";

const Settings = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    const status = getNotificationPermissionStatus();
    setNotificationsEnabled(status === 'granted');
  };

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) {
      toast.error("Notifications not supported in this browser");
      return;
    }

    setNotificationLoading(true);
    
    if (!notificationsEnabled) {
      try {
        await initializeMessaging();
        const token = await requestNotificationPermission();
        if (token) {
          setNotificationsEnabled(true);
          // Set up foreground message listener
          onForegroundMessage((payload) => {
            console.log('Notification received:', payload);
          });
          toast.success("Notifications enabled!");
        } else {
          toast.error("Permission denied. Please enable in browser settings.");
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        toast.error("Failed to enable notifications");
      }
    } else {
      toast.info("To disable notifications, please update your browser settings");
    }
    
    setNotificationLoading(false);
  };

  const loadAccounts = async () => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const userAccounts = await getAccountsByUserId(userId);
      setAccounts(userAccounts);
      
      // Find active account
      const active = userAccounts.find(acc => acc.isActive);
      if (active?.id) {
        setActiveAccountId(active.id);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      localStorage.removeItem('firebaseUserId');
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

  const handleAddAccount = () => {
    navigate("/add-account");
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId || !accountId) return;

      await setActiveAccount(userId, accountId);
      setActiveAccountId(accountId);
      
      // Reload accounts to reflect changes
      await loadAccounts();
      toast.success("Account switched");
    } catch (error) {
      console.error('Error switching account:', error);
      toast.error("Failed to switch account");
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

      {/* User Accounts Section */}
      <div className="p-4">
        <Card className="p-6 space-y-4 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Accounts</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary hover:bg-primary/10"
              onClick={handleAddAccount}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No accounts found</p>
          ) : (
            accounts.map((account) => (
              <div 
                key={account.id}
                className={`flex items-center space-x-4 p-3 rounded-lg border cursor-pointer transition-smooth ${
                  activeAccountId === account.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-accent/50'
                }`}
                onClick={() => account.id && handleSwitchAccount(account.id)}
              >
                <Avatar className="h-12 w-12 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {account.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    {account.name}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {account.phoneNumber}
                  </p>
                </div>

                {activeAccountId === account.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))
          )}
        </Card>
      </div>

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

      {/* Notification Settings */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg bg-muted ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div>
                <span className="font-medium text-foreground">Push Notifications</span>
                <p className="text-xs text-muted-foreground">
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              disabled={notificationLoading}
            />
          </div>
        </Card>
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
