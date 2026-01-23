import { useState, useEffect } from "react";
import { Search, MoreVertical, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore, Chat, PublicProfile } from "@/lib/chatStore";
import { searchByUsername, findOrCreateChat } from "@/lib/supabaseService";
import { toast } from "sonner";

// =============================================
// CHAT ITEM COMPONENT (MEMOIZED)
// =============================================

interface ChatItemProps {
  chat: Chat;
  onClick: () => void;
}

const ChatItem = ({ chat, onClick }: ChatItemProps) => {
  const otherUserId = chatStore.getOtherUserId(chat);
  const { profile } = useProfile(otherUserId);
  const unreadCount = chatStore.getUnreadCount(chat);
  
  const name = profile?.name || profile?.username || "Loading...";
  const avatar = profile?.avatar_url || "";
  const isOnline = profile?.is_online || false;
  const timestamp = formatTimestamp(chat.last_message_time);
  
  return (
    <div
      onClick={onClick}
      className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-smooth active:bg-muted/70"
    >
      <ChatAvatar
        name={name}
        src={avatar}
        status={isOnline ? "online" : "offline"}
        size="md"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">
            {name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {timestamp}
            </span>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="min-w-[20px] h-5 text-xs rounded-full px-1.5 flex items-center justify-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <p className={`text-sm truncate mt-0.5 ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {chat.last_message || "No messages yet"}
        </p>
      </div>
    </div>
  );
};

// =============================================
// UTILITIES
// =============================================

const formatTimestamp = (timestamp?: string | null): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString();
};

// =============================================
// MAIN COMPONENT
// =============================================

const Chats = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  
  // Use the cached chat store
  const { chats, loading, totalUnread } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();

  // Filter chats locally (instant)
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const profile = chatStore.getCachedProfile(chatStore.getOtherUserId(chat));
    const name = profile?.name?.toLowerCase() || profile?.username?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  // Handle username search
  const handleUsernameSearch = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    
    const query = searchQuery.trim();
    const isUsernameSearch = query.startsWith('@');
    const usernameToSearch = isUsernameSearch ? query.slice(1) : query;
    
    if (!isUsernameSearch || usernameToSearch.length < 3) return;

    setSearching(true);
    try {
      const foundUser = await searchByUsername(usernameToSearch);
      
      if (!foundUser) {
        toast.error(`No user found with username @${usernameToSearch}`);
        return;
      }

      if (foundUser.id === currentUserId) {
        toast.error("You can't chat with yourself");
        return;
      }

      const chatId = await findOrCreateChat(currentUserId, foundUser.id);

      if (chatId) {
        setSearchQuery("");
        navigate(`/chat/${chatId}`);
        toast.success(`Started chat with @${foundUser.username}`);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      toast.error("Failed to search user");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUsernameSearch();
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-4">
          <div onClick={() => navigate('/profile')} className="cursor-pointer relative">
            <ChatAvatar 
              name="You" 
              size="md"
              status="online"
            />
            {totalUnread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] rounded-full px-1 flex items-center justify-center"
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 bg-muted border-0 rounded-full"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {searchQuery.startsWith('@') && searchQuery.length > 1 && (
          <p className="text-xs text-muted-foreground mt-2 px-1">
            Press Enter to search for @{searchQuery.slice(1)}
          </p>
        )}
      </div>

      {/* Chat List - show immediately from cache, loading only when truly empty */}
      {chats.length === 0 && loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Search for @username to start a conversation
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                onClick={() => handleChatClick(chat.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="icon"
          onClick={() => navigate('/new-message')}
          className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Chats;
