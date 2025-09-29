import { useState, useEffect } from "react";
import { ArrowLeft, User, Wallet, Users, BookOpen, Phone, Bookmark, Settings as SettingsIcon, Share, Star, LogOut, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { AccountStore, Account } from "@/lib/accountStore";

const Settings = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  useEffect(() => {
    // Initialize default account if none exist
    AccountStore.initializeDefaultAccount();
    
    // Load accounts and active account
    setAccounts(AccountStore.getAccounts());
    setActiveAccount(AccountStore.getActiveAccount());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
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
        // Already on settings page
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

  const handleSwitchAccount = (accountId: string) => {
    AccountStore.switchAccount(accountId);
    setActiveAccount(AccountStore.getActiveAccount());
    setAccounts(AccountStore.getAccounts());
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

          {accounts.map((account) => (
            <div 
              key={account.id}
              className={`flex items-center space-x-4 p-3 rounded-lg border cursor-pointer transition-smooth ${
                activeAccount?.id === account.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-accent/50'
              }`}
              onClick={() => handleSwitchAccount(account.id)}
            >
              <Avatar className="h-12 w-12 border border-primary/20">
                <AvatarImage src={account.avatar} />
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

              {activeAccount?.id === account.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          ))}
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

      {/* Logout Section */}
      <div className="p-4 mt-6">
        <Card className="p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;