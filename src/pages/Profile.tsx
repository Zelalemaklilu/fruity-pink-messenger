import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MessageSquare, MoreVertical, Images, Edit2, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AccountStore } from "@/lib/accountStore";
import { getAccountsByoderId, updateAccount, isUsernameUnique, Account } from "@/lib/firestoreService";
import { auth } from "@/lib/firebase";

const Profile = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    const oderId = auth.currentUser?.uid || localStorage.getItem("firebaseUserId");
    if (oderId) {
      try {
        const accounts = await getAccountsByoderId(oderId);
        if (accounts.length > 0) {
          const activeAccount = accounts.find(acc => acc.isActive) || accounts[0];
          setAccount(activeAccount);
          setEditName(activeAccount.name);
          setEditUsername(activeAccount.username || '');
          setEditBio(activeAccount.bio || "");
          setEditAvatarUrl(activeAccount.avatarUrl || activeAccount.photoURL || "");
        }
      } catch (error) {
        console.error("Error loading Firestore account:", error);
        // Fallback to local AccountStore
        const localAccount = AccountStore.getActiveAccount();
        if (localAccount) {
          setAccount({
            id: localAccount.id,
            oderId: oderId,
            username: localAccount.name.toLowerCase().replace(/\s/g, ''),
            name: localAccount.name,
            phoneNumber: localAccount.phoneNumber,
            isActive: true
          });
          setEditName(localAccount.name);
          setEditUsername(localAccount.name.toLowerCase().replace(/\s/g, ''));
        }
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!account?.id) {
      toast.error("No account found");
      return;
    }

    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (!editUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (editUsername.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setSaving(true);
    try {
      const normalizedUsername = editUsername.toLowerCase().trim().replace(/\s/g, '');
      
      // Check if username changed and if new one is unique
      if (normalizedUsername !== account.username) {
        const isUnique = await isUsernameUnique(normalizedUsername, account.oderId);
        if (!isUnique) {
          toast.error("Username already taken. Please choose another.");
          setSaving(false);
          return;
        }
      }

      await updateAccount(account.id, {
        name: editName.trim(),
        username: normalizedUsername,
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        photoURL: editAvatarUrl.trim()
      });

      setAccount({
        ...account,
        name: editName.trim(),
        username: normalizedUsername,
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        photoURL: editAvatarUrl.trim()
      });

      setEditDialogOpen(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error && error.message === 'Username already taken') {
        toast.error("Username already taken. Please choose another.");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartChat = () => {
    navigate("/chats");
  };

  const handleCall = () => {
    toast.info("Starting voice call...");
  };

  const handleViewMedia = () => {
    toast.info("Opening media gallery...");
  };

  const handleMoreOptions = () => {
    navigate("/settings");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = account?.name || "User";
  const displayUsername = account?.username || displayName.toLowerCase().replace(/\s/g, '');
  const displayPhone = account?.phoneNumber || account?.email || "";
  const displayBio = account?.bio || "Welcome to Zeshopp! 🚀";
  const displayAvatar = account?.avatarUrl || account?.photoURL || "";
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
            {displayAvatar ? (
              <Avatar className="w-32 h-32 ring-4 ring-background">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <ChatAvatar
                name={displayName}
                size="lg"
                status="online"
                className="ring-4 ring-background w-32 h-32"
              />
            )}
            
            {/* Edit Button on Avatar */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Avatar Preview */}
                  <div className="flex justify-center">
                    <div className="relative">
                      {editAvatarUrl ? (
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={editAvatarUrl} alt="Preview" />
                          <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                            {editName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Profile Photo URL</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/photo.jpg"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a URL for your profile photo
                    </p>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username (unique)</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-lg border border-r-0 border-border h-10 flex items-center">
                        @
                      </span>
                      <Input
                        id="username"
                        placeholder="username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        className="rounded-l-none"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be unique. Others can find you with this.
                    </p>
                  </div>

                  {/* Bio Input */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={150}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {editBio.length}/150
                    </p>
                  </div>

                  {/* Save Button */}
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-6 text-center space-y-3 px-4">
        <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
        <p className="text-muted-foreground font-medium">
          @{displayUsername}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {displayBio}
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
            Chats
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-lg">Info</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">{isEmail ? "Email" : "Phone"}</span>
              <span className="text-foreground font-medium">{displayPhone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground font-medium">@{displayUsername}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Bio</span>
              <span className="text-foreground font-medium text-right max-w-[200px] truncate">
                {displayBio}
              </span>
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
      </div>
    </div>
  );
};

export default Profile;
