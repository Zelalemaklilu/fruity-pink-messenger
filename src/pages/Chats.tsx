import { useState, useEffect, useCallback } from "react";
import NavigationDrawer from "@/components/chat/NavigationDrawer";
import { Search, MoreVertical, Plus, Loader2, Users, Pin, PinOff, Filter, Check, CheckCheck, Camera, Mic, FileIcon, MessageCircle, ArrowLeft, Archive, FolderOpen, Star, Briefcase, Heart, Hash, Trash2, Pencil, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore, Chat, PublicProfile } from "@/lib/chatStore";
import { searchByUsername, findOrCreateChat } from "@/lib/supabaseService";
import { getMyGroups, GroupWithLastMessage } from "@/lib/groupService";
import { toast } from "sonner";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { SpeedDialFAB } from "@/components/SpeedDialFAB";
import { usePinnedChats } from "@/hooks/usePinnedChats";
import { formatLastSeen } from "@/lib/formatLastSeen";
import { getDraft } from "@/lib/draftService";
import { archiveChat, unarchiveChat, getArchivedChatIds, isChatArchived } from "@/lib/archiveService";
import { getChatFolders, getFolderChatIds, addChatFolder, removeChatFolder, updateChatFolder, addChatToFolder, removeChatFromFolder, getChatFolderId, type ChatFolder } from "@/lib/chatFolderService";

type ChatFilter = "all" | "unread" | "groups";

const FOLDER_ICON_OPTIONS = [
  { value: "folder", label: "Folder", Icon: FolderOpen },
  { value: "star", label: "Star", Icon: Star },
  { value: "briefcase", label: "Work", Icon: Briefcase },
  { value: "heart", label: "Personal", Icon: Heart },
  { value: "hash", label: "Topic", Icon: Hash },
  { value: "users", label: "Group", Icon: Users },
];

const FOLDER_COLOR_OPTIONS = [
  { value: "hsl(210, 90%, 60%)", label: "Blue" },
  { value: "hsl(145, 65%, 45%)", label: "Green" },
  { value: "hsl(38, 92%, 50%)", label: "Amber" },
  { value: "hsl(0, 75%, 55%)", label: "Red" },
  { value: "hsl(260, 80%, 60%)", label: "Purple" },
  { value: "hsl(338, 85%, 60%)", label: "Pink" },
  { value: "hsl(168, 75%, 41%)", label: "Teal" },
  { value: "hsl(45, 90%, 55%)", label: "Gold" },
];

const getFolderIcon = (iconValue: string) => {
  const found = FOLDER_ICON_OPTIONS.find(o => o.value === iconValue);
  if (found) {
    const IconComp = found.Icon;
    return <IconComp className="h-4 w-4" />;
  }
  return <FolderOpen className="h-4 w-4" />;
};

// =============================================
// CHAT ITEM COMPONENT (MEMOIZED)
// =============================================

interface ChatItemProps {
  chat: Chat;
  onClick: () => void;
  index: number;
  pinned?: boolean;
  onTogglePin?: () => void;
}

const MessageTypeIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case "image": return <Camera className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    case "voice": return <Mic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    case "file": return <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    default: return null;
  }
};

const MessageStatusTick = ({ status }: { status?: string }) => {
  switch (status) {
    case "read": return <CheckCheck className="h-3.5 w-3.5 text-read-receipt shrink-0" />;
    case "delivered": return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    case "sent": return <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    default: return null;
  }
};

const ChatItem = ({ chat, onClick, index, pinned, onTogglePin, onArchive, onMoveToFolder }: ChatItemProps & { onArchive?: () => void; onMoveToFolder?: () => void }) => {
  const otherUserId = chatStore.getOtherUserId(chat);
  const { profile } = useProfile(otherUserId);
  const unreadCount = chatStore.getUnreadCount(chat);
  const [showActions, setShowActions] = useState(false);
  const x = useMotionValue(0);
  const lastMsgInfo = (chatStore as any).getLastMessageInfo?.(chat.id) || null;
  
  const name = profile?.name || profile?.username || "Loading...";
  const avatar = profile?.avatar_url || "";
  const isOnline = profile?.is_online || false;
  const lastSeenText = formatLastSeen(profile?.last_seen, isOnline);
  const timestamp = formatTimestamp(chat.last_message_time);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      setShowActions(true);
    } else {
      setShowActions(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 flex items-stretch z-0"
          >
            <button
              data-testid={`button-pin-${chat.id}`}
              className="px-4 bg-blue-500 text-white flex items-center text-xs font-medium gap-1"
              onClick={(e) => { e.stopPropagation(); onTogglePin?.(); setShowActions(false); }}
            >
              {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              {pinned ? "Unpin" : "Pin"}
            </button>
            <button
              data-testid={`button-mute-${chat.id}`}
              className="px-4 bg-primary text-primary-foreground flex items-center text-xs font-medium"
              onClick={(e) => { e.stopPropagation(); toast.info("Chat muted"); setShowActions(false); }}
            >
              Mute
            </button>
            <button
              data-testid={`button-move-folder-${chat.id}`}
              className="px-4 bg-purple-500 text-white flex items-center text-xs font-medium gap-1"
              onClick={(e) => { e.stopPropagation(); onMoveToFolder?.(); setShowActions(false); }}
            >
              <FolderInput className="h-3 w-3" />
              Move
            </button>
            <button
              data-testid={`button-archive-${chat.id}`}
              className="px-4 bg-destructive text-destructive-foreground flex items-center text-xs font-medium"
              onClick={(e) => { e.stopPropagation(); onArchive?.(); setShowActions(false); }}
            >
              Archive
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: showActions ? -240 : 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        drag="x"
        dragConstraints={{ left: -240, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        onClick={() => { if (!showActions) onClick(); else setShowActions(false); }}
        className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted/70 bg-background relative z-10"
      >
      <ChatAvatar
        name={name}
        src={avatar}
        status={isOnline ? "online" : "offline"}
        size="md"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
            <h3 className="font-semibold text-foreground truncate">
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
        {lastSeenText && (
          <p className={`text-[11px] mt-0.5 ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
            {lastSeenText}
          </p>
        )}
        <div className={`flex items-center gap-1 mt-0.5 ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {(() => {
            const draft = getDraft(chat.id);
            if (draft) {
              return (
                <p className="text-sm truncate">
                  <span className="text-destructive font-medium">Draft: </span>
                  {draft}
                </p>
              );
            }
            return (
              <>
                {chat.last_sender_id === chatStore.getCurrentUserId() && lastMsgInfo?.isMine && (
                  <MessageStatusTick status={lastMsgInfo.status} />
                )}
                {lastMsgInfo?.type && lastMsgInfo.type !== "text" && (
                  <MessageTypeIcon type={lastMsgInfo.type} />
                )}
                <p className="text-sm truncate">
                  {lastMsgInfo?.type === "image" ? "Photo" :
                   lastMsgInfo?.type === "voice" ? "Voice message" :
                   lastMsgInfo?.type === "file" ? "File" :
                   chat.last_message || "No messages yet"}
                </p>
              </>
            );
          })()}
        </div>
      </div>
      </motion.div>
    </div>
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

const filterLabels: Record<ChatFilter, string> = {
  all: "All",
  unread: "Unread",
  groups: "Groups",
};

const Chats = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [groups, setGroups] = useState<GroupWithLastMessage[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>("all");
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ChatFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderIcon, setFolderIcon] = useState("folder");
  const [folderColor, setFolderColor] = useState("hsl(210, 90%, 60%)");
  const [folderManageDialogOpen, setFolderManageDialogOpen] = useState(false);
  const [managingFolder, setManagingFolder] = useState<ChatFolder | null>(null);
  const [moveToFolderDialogOpen, setMoveToFolderDialogOpen] = useState(false);
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const [folderVersion, setFolderVersion] = useState(0);
  const navigate = useNavigate();
  const { pinnedIds, togglePin, isPinned } = usePinnedChats();
  
  const { chats, loading, totalUnread } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();

  const refreshFolders = useCallback(() => {
    setFolders(getChatFolders());
    setFolderVersion(v => v + 1);
  }, []);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

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

  useEffect(() => {
    setArchivedIds(getArchivedChatIds());
  }, []);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName("");
    setFolderIcon("folder");
    setFolderColor("hsl(210, 90%, 60%)");
    setFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: ChatFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderIcon(folder.icon);
    setFolderColor(folder.color);
    setFolderManageDialogOpen(false);
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    if (editingFolder) {
      updateChatFolder(editingFolder.id, { name: folderName.trim(), icon: folderIcon, color: folderColor });
      toast.success("Folder updated");
    } else {
      const newFolder: ChatFolder = {
        id: Date.now().toString(),
        name: folderName.trim(),
        icon: folderIcon,
        color: folderColor,
      };
      addChatFolder(newFolder);
      toast.success("Folder created");
    }
    refreshFolders();
    setFolderDialogOpen(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    removeChatFolder(folderId);
    if (activeFolderId === folderId) setActiveFolderId(null);
    refreshFolders();
    setFolderManageDialogOpen(false);
    toast.success("Folder deleted");
  };

  const handleFolderLongPress = (folder: ChatFolder) => {
    setManagingFolder(folder);
    setFolderManageDialogOpen(true);
  };

  const handleOpenMoveToFolder = (chatId: string) => {
    setMovingChatId(chatId);
    setMoveToFolderDialogOpen(true);
  };

  const handleMoveToFolder = (folderId: string) => {
    if (!movingChatId) return;
    const currentFolderId = getChatFolderId(movingChatId);
    if (currentFolderId) {
      removeChatFromFolder(currentFolderId, movingChatId);
    }
    addChatToFolder(folderId, movingChatId);
    refreshFolders();
    setMoveToFolderDialogOpen(false);
    setMovingChatId(null);
    const folder = folders.find(f => f.id === folderId);
    toast.success(`Chat moved to ${folder?.name || "folder"}`);
  };

  const handleRemoveFromFolder = () => {
    if (!movingChatId) return;
    const currentFolderId = getChatFolderId(movingChatId);
    if (currentFolderId) {
      removeChatFromFolder(currentFolderId, movingChatId);
      refreshFolders();
      toast.success("Chat removed from folder");
    }
    setMoveToFolderDialogOpen(false);
    setMovingChatId(null);
  };

  const handleArchiveChat = (chatId: string) => {
    archiveChat(chatId);
    setArchivedIds(getArchivedChatIds());
    toast.success("Chat archived");
  };

  const handleUnarchiveChat = (chatId: string) => {
    unarchiveChat(chatId);
    setArchivedIds(getArchivedChatIds());
    toast.success("Chat unarchived");
  };

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

  // Sort pinned chats first
  const sortedConversations = [...conversations].sort((a, b) => {
    const aId = a.type === 'chat' ? a.data.id : a.data.id;
    const bId = b.type === 'chat' ? b.data.id : b.data.id;
    const aPinned = isPinned(aId);
    const bPinned = isPinned(bId);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return b.time - a.time;
  });

  const activeFolderChatIds = activeFolderId ? getFolderChatIds(activeFolderId) : null;

  // Apply active filter + search + archive + folder filter
  const filteredConversations = sortedConversations.filter(item => {
    const itemId = item.type === 'chat' ? item.data.id : item.data.id;
    const isArchived = archivedIds.includes(itemId);
    if (showArchived) {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
    }
    if (activeFolderChatIds !== null) {
      if (!activeFolderChatIds.includes(itemId)) return false;
    }
    if (activeFilter === "groups" && item.type !== "group") return false;
    if (activeFilter === "unread") {
      if (item.type === "chat") {
        const unread = chatStore.getUnreadCount(item.data);
        if (unread <= 0) return false;
      } else {
        return false;
      }
    }

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

  const archivedCount = conversations.filter(c => archivedIds.includes(c.type === 'chat' ? c.data.id : c.data.id)).length;

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

      {/* Filter Chips */}
      <div className="px-4 py-2 flex gap-2 border-b border-border overflow-x-auto">
        {(Object.keys(filterLabels) as ChatFilter[]).map((filter) => (
          <button
            key={filter}
            data-testid={`filter-${filter}`}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {filterLabels[filter]}
            {filter === "unread" && totalUnread > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">
                {totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Folder Tabs */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border overflow-x-auto" data-testid="folder-tabs-row">
        <button
          data-testid="folder-tab-all"
          onClick={() => setActiveFolderId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeFolderId === null
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          All Chats
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            data-testid={`folder-tab-${folder.id}`}
            onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
            onContextMenu={(e) => { e.preventDefault(); handleFolderLongPress(folder); }}
            onTouchStart={() => {
              const timer = setTimeout(() => handleFolderLongPress(folder), 600);
              const clear = () => { clearTimeout(timer); document.removeEventListener("touchend", clear); document.removeEventListener("touchmove", clear); };
              document.addEventListener("touchend", clear, { once: true });
              document.addEventListener("touchmove", clear, { once: true });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeFolderId === folder.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground"
            }`}
            style={activeFolderId === folder.id ? { color: folder.color, borderColor: `${folder.color}40`, backgroundColor: `${folder.color}15` } : undefined}
          >
            {getFolderIcon(folder.icon)}
            {folder.name}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-create-folder"
          onClick={handleCreateFolder}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Stories */}
      <StoriesBar />

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
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 px-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"
              >
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? "No chats found" : "No chats yet"}
              </h2>
              <p className="text-muted-foreground max-w-xs">
                {searchQuery 
                  ? "Try a different search or start a new conversation" 
                  : "Search for @username to start a conversation"}
              </p>
            </motion.div>
          ) : (
            <>
              {filteredConversations.map((item, index) => 
                item.type === 'chat' ? (
                  <ChatItem
                    key={`chat-${item.data.id}`}
                    chat={item.data}
                    onClick={() => handleChatClick(item.data.id)}
                    index={index}
                    pinned={isPinned(item.data.id)}
                    onTogglePin={() => togglePin(item.data.id)}
                    onArchive={() => showArchived ? handleUnarchiveChat(item.data.id) : handleArchiveChat(item.data.id)}
                    onMoveToFolder={() => handleOpenMoveToFolder(item.data.id)}
                  />
                ) : (
                  <GroupItem
                    key={`group-${item.data.id}`}
                    group={item.data}
                    onClick={() => handleGroupClick(item.data.id)}
                    index={index}
                  />
                )
              )}
              {!showArchived && archivedCount > 0 && !searchQuery && (
                <button
                  onClick={() => setShowArchived(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted/50 transition-colors"
                  data-testid="button-show-archived"
                >
                  <Archive className="h-5 w-5" />
                  <span className="text-sm font-medium">Archived Chats ({archivedCount})</span>
                </button>
              )}
              {showArchived && (
                <button
                  onClick={() => setShowArchived(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-primary hover:bg-muted/50 transition-colors"
                  data-testid="button-hide-archived"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Back to Chats</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Speed Dial FAB */}
      <SpeedDialFAB />

      {/* Bottom nav spacer */}
      <div className="h-16" />

      {/* Create/Edit Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="max-w-sm" data-testid="dialog-folder-form">
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Edit Folder" : "Create Folder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                data-testid="input-folder-name"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="bg-muted border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      data-testid={`button-folder-icon-${opt.value}`}
                      onClick={() => setFolderIcon(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        folderIcon === opt.value
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    data-testid={`button-folder-color-${opt.label.toLowerCase()}`}
                    onClick={() => setFolderColor(opt.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      folderColor === opt.value ? "ring-2 ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ backgroundColor: opt.value, outlineColor: opt.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-save-folder"
              onClick={handleSaveFolder}
              className="w-full"
            >
              {editingFolder ? "Save Changes" : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Management Dialog (long-press) */}
      <Dialog open={folderManageDialogOpen} onOpenChange={setFolderManageDialogOpen}>
        <DialogContent className="max-w-xs" data-testid="dialog-folder-manage">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {managingFolder && getFolderIcon(managingFolder.icon)}
              {managingFolder?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <button
              data-testid="button-edit-folder"
              onClick={() => managingFolder && handleEditFolder(managingFolder)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit Folder
            </button>
            <button
              data-testid="button-delete-folder"
              onClick={() => managingFolder && handleDeleteFolder(managingFolder.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Folder
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveToFolderDialogOpen} onOpenChange={setMoveToFolderDialogOpen}>
        <DialogContent className="max-w-xs" data-testid="dialog-move-to-folder">
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {folders.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No folders yet</p>
                <Button
                  data-testid="button-create-folder-from-move"
                  variant="outline"
                  onClick={() => { setMoveToFolderDialogOpen(false); handleCreateFolder(); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            ) : (
              <>
                {folders.map((folder) => {
                  const isCurrentFolder = movingChatId ? getChatFolderId(movingChatId) === folder.id : false;
                  return (
                    <button
                      key={folder.id}
                      data-testid={`button-move-to-${folder.id}`}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                        isCurrentFolder ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span style={{ color: folder.color }}>{getFolderIcon(folder.icon)}</span>
                      {folder.name}
                      {isCurrentFolder && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </button>
                  );
                })}
                {movingChatId && getChatFolderId(movingChatId) && (
                  <button
                    data-testid="button-remove-from-folder"
                    onClick={handleRemoveFromFolder}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from Folder
                  </button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chats;