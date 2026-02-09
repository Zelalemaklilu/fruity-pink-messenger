import { useState, useEffect } from "react";
import { Search, MoreVertical, Plus, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore, Chat, PublicProfile } from "@/lib/chatStore";
import { searchByUsername, findOrCreateChat } from "@/lib/supabaseService";
import { getMyGroups, GroupWithLastMessage } from "@/lib/groupService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// =============================================
// CHAT ITEM COMPONENT (MEMOIZED)
// =============================================

interface ChatItemProps {
  chat: Chat;
  onClick: () => void;
  index: number;
}

const ChatItem = ({ chat, onClick, index }: ChatItemProps) => {
  const otherUserId = chatStore.getOtherUserId(chat);
  const { profile } = useProfile(otherUserId);
  const unreadCount = chatStore.getUnreadCount(chat);
  
  const name = profile?.name || profile?.username || "Loading...";
  const avatar = profile?.avatar_url || "";
  const isOnline = profile?.is_online || false;
  const timestamp = formatTimestamp(chat.last_message_time);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted/70"
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Badge 
                  variant="destructive" 
                  className="min-w-[20px] h-5 text-xs rounded-full px-1.5 flex items-center justify-center"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
        <p className={`text-sm truncate mt-0.5 ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {chat.last_message || "No messages yet"}
        </p>
      </div>
    </motion.div>
  );
};

// =============================================
// GROUP ITEM COMPONENT
// =============================================

interface GroupItemProps {
  group: GroupWithLastMessage;
  onClick: () => void;
  index: number;
}

const GroupItem = ({ group, onClick, index }: GroupItemProps) => {
  const timestamp = formatTimestamp(group.last_message_time);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted/70"
    >
      <div className="relative">
        <ChatAvatar
          name={group.name}
          src={group.avatar_url || undefined}
          size="md"
        />
        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
          <Users className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">
            {group.name}
          </h3>
          <span className="text-xs text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {group.last_message || `${group.member_count} members`}
        </p>
      </div>
    </motion.div>
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

// Combined item type for sorting
type ConversationItem = 
  | { type: 'chat'; data: Chat; time: number }
  | { type: 'group'; data: GroupWithLastMessage; time: number };

// =============================================
// MAIN COMPONENT
// =============================================

const Chats = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [groups, setGroups] = useState<GroupWithLastMessage[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const navigate = useNavigate();
  
  // Use the cached chat store
  const { chats, loading, totalUnread } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const myGroups = await getMyGroups();
        setGroups(myGroups);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (currentUserId) {
      loadGroups();
    }
  }, [currentUserId]);

  // Combine and sort chats and groups
  const conversations: ConversationItem[] = [
    ...chats.map(chat => ({
      type: 'chat' as const,
      data: chat,
      time: chat.last_message_time ? new Date(chat.last_message_time).getTime() : 0,
    })),
    ...groups.map(group => ({
      type: 'group' as const,
      data: group,
      time: group.last_message_time ? new Date(group.last_message_time).getTime() : 0,
    })),
  ].sort((a, b) => b.time - a.time);

  // Filter conversations locally
  const filteredConversations = conversations.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (item.type === 'chat') {
      const profile = chatStore.getCachedProfile(chatStore.getOtherUserId(item.data));
      const name = profile?.name?.toLowerCase() || profile?.username?.toLowerCase() || "";
      return name.includes(query);
    } else {
      return item.data.name.toLowerCase().includes(query);
    }
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

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  const isLoading = loading || loadingGroups;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="cursor-pointer relative"
          >
            <ChatAvatar 
              name="You" 
              size="md"
              status="online"
            />
            {totalUnread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] rounded-full px-1 flex items-center justify-center"
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </Badge>
              </motion.div>
            )}
          </motion.div>
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
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-xs text-muted-foreground mt-2 px-1"
          >
            Press Enter to search for @{searchQuery.slice(1)}
          </motion.p>
        )}
      </motion.div>

      {/* Chat List */}
      {conversations.length === 0 && isLoading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4"
            >
              <p className="text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Search for @username to start a conversation
              </p>
            </motion.div>
          ) : (
            filteredConversations.map((item, index) => 
              item.type === 'chat' ? (
                <ChatItem
                  key={`chat-${item.data.id}`}
                  chat={item.data}
                  onClick={() => handleChatClick(item.data.id)}
                  index={index}
                />
              ) : (
                <GroupItem
                  key={`group-${item.data.id}`}
                  group={item.data}
                  onClick={() => handleGroupClick(item.data.id)}
                  index={index}
                />
              )
            )
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            onClick={() => navigate('/new-message')}
            className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 shadow-primary"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Chats;