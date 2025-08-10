import { ArrowLeft, User, Wallet, Users, BookOpen, Phone, Bookmark, Settings as SettingsIcon, Share, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
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
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <ChatAvatar
              name="You"
              size="lg"
              status="online"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Your Name</h3>
              <p className="text-sm text-muted-foreground">+251 9XX XXX XXX</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
            Add another account
          </Button>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth"
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