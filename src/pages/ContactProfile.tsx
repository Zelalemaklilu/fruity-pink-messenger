import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Phone, Video, BellOff, Bell, MoreVertical, Loader2, QrCode, FileIcon, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCall } from "@/contexts/CallContext";
import { formatLastSeen } from "@/lib/formatLastSeen";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isUserBlocked, blockUser, unblockUser as unblockUserService } from "@/lib/blockService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProfileData {
  id: string;
  name: string | null;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  is_online: boolean | null;
  last_seen: string | null;
  email: string | null;
}

interface SharedMedia {
  id: string;
  media_url: string | null;
  message_type: string | null;
  created_at: string | null;
}

const ContactProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { startCall } = useCall();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"media" | "files">("media");
  const [sharedMedia, setSharedMedia] = useState<SharedMedia[]>([]);
  const [sharedFiles, setSharedFiles] = useState<{id: string; file_name: string | null; media_url: string | null; created_at: string | null}[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setSharedMedia([]);
    setSharedFiles([]);
    setChatId(null);
    setIsBlocked(isUserBlocked(userId));
    loadProfile();
    loadChatId();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as ProfileData);
    }
    setLoading(false);
  };

  const loadChatId = async () => {
    if (!userId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("chats")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (data) {
      setChatId(data.id);
      loadSharedMedia(data.id);
      loadSharedFiles(data.id);
    }
  };

  const loadSharedMedia = async (cId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, media_url, message_type, created_at")
      .eq("chat_id", cId)
      .in("message_type", ["image", "video"])
      .not("media_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      setSharedMedia(data as SharedMedia[]);
    }
  };

  const loadSharedFiles = async (cId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, file_name, media_url, created_at")
      .eq("chat_id", cId)
      .eq("message_type", "file")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      setSharedFiles(data);
    }
  };

  useEffect(() => {
    if (chatId) {
      try {
        const mutedChats = JSON.parse(localStorage.getItem("zeshopp_muted_chats") || "[]");
        setIsMuted(mutedChats.includes(chatId));
      } catch {}
    }
  }, [chatId]);

  const handleToggleMute = () => {
    if (!chatId) return;
    try {
      const mutedChats = JSON.parse(localStorage.getItem("zeshopp_muted_chats") || "[]") as string[];
      let updated: string[];
      if (mutedChats.includes(chatId)) {
        updated = mutedChats.filter((id: string) => id !== chatId);
        setIsMuted(false);
        toast.success("Chat unmuted");
      } else {
        updated = [...mutedChats, chatId];
        setIsMuted(true);
        toast.success("Chat muted");
      }
      localStorage.setItem("zeshopp_muted_chats", JSON.stringify(updated));
    } catch {}
  };

  const handleMessage = () => {
    if (chatId) {
      navigate(`/chat/${chatId}`);
    } else {
      navigate("/new-message");
    }
  };

  const handleCall = (type: "voice" | "video") => {
    if (!userId || !profile) return;
    startCall(userId, profile.name || "User", type, profile.avatar_url || undefined);
  };

  const handleBlockToggle = () => {
    if (!userId) return;
    if (isBlocked) {
      unblockUserService(userId);
      setIsBlocked(false);
      toast.success(`${profile?.name || profile?.username || "User"} unblocked`);
    } else {
      setShowBlockDialog(true);
    }
  };

  const confirmBlock = () => {
    if (!userId) return;
    blockUser(userId);
    setIsBlocked(true);
    setShowBlockDialog(false);
    toast.success(`${profile?.name || profile?.username || "User"} blocked`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const displayName = profile.name || profile.username;
  const lastSeenText = formatLastSeen(profile.last_seen, profile.is_online || false);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="button-back-contact-profile">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-contact-menu">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          <Avatar className="w-28 h-28 mb-4">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-4xl bg-primary/20 text-primary">
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground" data-testid="text-contact-name">{displayName}</h2>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-contact-status">
            {lastSeenText || "offline"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 px-6 pb-6">
          <button
            onClick={handleMessage}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors min-w-[72px]"
            data-testid="button-contact-message"
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Message</span>
          </button>
          <button
            onClick={handleToggleMute}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors min-w-[72px]"
            data-testid="button-contact-mute"
          >
            {isMuted ? <Bell className="h-5 w-5 text-muted-foreground" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button
            onClick={() => handleCall("voice")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors min-w-[72px]"
            data-testid="button-contact-call"
          >
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Call</span>
          </button>
          <button
            onClick={() => handleCall("video")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors min-w-[72px]"
            data-testid="button-contact-video"
          >
            <Video className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Video</span>
          </button>
          <button
            onClick={handleBlockToggle}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors min-w-[72px]",
              isBlocked ? "bg-destructive/10 hover:bg-destructive/20" : "bg-muted/50 hover:bg-muted"
            )}
            data-testid="button-contact-block"
          >
            <UserX className={cn("h-5 w-5", isBlocked ? "text-destructive" : "text-muted-foreground")} />
            <span className={cn("text-xs", isBlocked ? "text-destructive" : "text-muted-foreground")}>
              {isBlocked ? "Unblock" : "Block"}
            </span>
          </button>
        </div>

        {/* Info section */}
        <div className="px-4 pb-4 space-y-1">
          {profile.phone_number && (
            <div className="py-3 px-1">
              <p className="text-sm font-medium text-foreground" data-testid="text-contact-phone">{profile.phone_number}</p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
          )}
          {profile.bio && (
            <div className="py-3 px-1">
              <p className="text-sm text-foreground" data-testid="text-contact-bio">{profile.bio}</p>
              <p className="text-xs text-muted-foreground">Bio</p>
            </div>
          )}
          <div className="py-3 px-1 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="text-contact-username">@{profile.username}</p>
              <p className="text-xs text-muted-foreground">Username</p>
            </div>
            <QrCode className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Media tabs */}
        <div className="border-t border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("media")}
              className={cn(
                "flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2",
                activeTab === "media"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
              data-testid="tab-media"
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={cn(
                "flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2",
                activeTab === "files"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
              data-testid="tab-files"
            >
              Files
            </button>
          </div>

          {/* Media grid */}
          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {sharedMedia.length > 0 ? (
                sharedMedia.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-muted relative overflow-hidden cursor-pointer"
                    onClick={() => item.media_url && window.open(item.media_url, "_blank")}
                    data-testid={`media-item-${item.id}`}
                  >
                    <img
                      src={item.media_url || ""}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">No shared media yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="px-4 py-2">
              {sharedFiles.length > 0 ? (
                sharedFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.media_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors rounded-md px-2"
                    data-testid={`file-item-${file.id}`}
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.file_name || "File"}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No shared files yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {profile?.name || profile?.username}? They won't be able to message you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-block">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-block"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactProfile;
