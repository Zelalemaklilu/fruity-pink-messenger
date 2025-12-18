import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MessageSquare, UserX, Flag, MoreVertical, Images, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AccountStore } from "@/lib/accountStore";
import { getAccountsByUserId } from "@/lib/firestoreService";
import { auth } from "@/lib/firebase";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [account, setAccount] = useState<{ name: string; phoneNumber: string } | null>(null);

  useEffect(() => {
    const loadAccount = async () => {
      // First try to get from Firestore
      const userId = auth.currentUser?.uid || localStorage.getItem("firebaseUserId");
      if (userId) {
        try {
          const accounts = await getAccountsByUserId(userId);
          if (accounts.length > 0) {
            const activeAccount = accounts.find(acc => acc.isActive) || accounts[0];
            setAccount({
              name: activeAccount.name,
              phoneNumber: activeAccount.phoneNumber
            });
            return;
          }
        } catch (error) {
          console.error("Error loading Firestore account:", error);
        }
      }

      // Fallback to local AccountStore
      const localAccount = AccountStore.getActiveAccount();
      if (localAccount) {
        setAccount({
          name: localAccount.name,
          phoneNumber: localAccount.phoneNumber
        });
      }
    };

    loadAccount();
  }, []);

  const handleStartChat = () => {
    navigate("/chats");
  };

  const handleCall = () => {
    toast({
      title: "Calling",
      description: "Starting voice call...",
    });
  };

  const handleViewMedia = () => {
    toast({
      title: "Shared Media",
      description: "Opening media gallery...",
    });
  };

  const handleBlockUser = () => {
    toast({
      title: "Block User",
      description: "This action is not available for your own profile",
    });
  };

  const handleReportUser = () => {
    toast({
      title: "Report",
      description: "This action is not available for your own profile",
    });
  };

  const handleMoreOptions = () => {
    navigate("/settings");
  };

  const displayName = account?.name || "User";
  const displayPhone = account?.phoneNumber || "";
  const isEmail = displayPhone.includes("@");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/chats")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleMoreOptions}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        <div className="h-40 bg-gradient-primary shadow-primary"></div>
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <ChatAvatar
              name={displayName}
              size="lg"
              status="online"
              className="ring-4 ring-background w-32 h-32"
            />
          </div>
        </div>
      </div>

      <div className="pt-20 pb-6 text-center space-y-3 px-4">
        <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
        <p className="text-muted-foreground font-medium">
          {isEmail ? displayPhone : `@${displayName.toLowerCase().replace(/\s/g, '')}`}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Welcome to Zeshopp! 🚀
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-12 bg-gradient-primary hover:opacity-90 transition-smooth rounded-xl font-semibold"
            onClick={handleStartChat}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Start Chat
          </Button>
          <Button 
            variant="outline" 
            className="h-12 rounded-xl font-semibold border-2 hover:bg-accent/10"
            onClick={handleCall}
          >
            <Phone className="h-5 w-5 mr-2" />
            Call
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 space-y-4 pb-6">
        <Card className="p-5 space-y-4 shadow-card">
          <h3 className="font-semibold text-foreground text-lg">Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">{isEmail ? "Email" : "Phone"}</span>
              <span className="text-foreground font-medium">{displayPhone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground font-medium">@{displayName.toLowerCase().replace(/\s/g, '')}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="text-status-online font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-status-online rounded-full"></div>
                Online
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 shadow-card">
          <h3 className="font-semibold text-foreground text-lg">Shared Media</h3>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="aspect-square bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer"
              ></div>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full text-primary hover:bg-primary/10 font-medium"
            onClick={handleViewMedia}
          >
            <Images className="h-4 w-4 mr-2" />
            View all media
          </Button>
        </Card>

        <Card className="p-5 space-y-4 shadow-card">
          <h3 className="font-semibold text-foreground text-lg">Actions</h3>
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
              onClick={handleBlockUser}
            >
              <UserX className="h-4 w-4 mr-3" />
              Block User
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
              onClick={handleReportUser}
            >
              <Flag className="h-4 w-4 mr-3" />
              Report User
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;