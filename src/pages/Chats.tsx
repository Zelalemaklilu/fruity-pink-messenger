import { useState, useEffect } from "react";
import { Search, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { getChatsByAccountId, Chat as FirestoreChat } from "@/lib/firestoreService";
import { AccountStore } from "@/lib/accountStore";
import { Timestamp } from "firebase/firestore";

interface ChatDisplay {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  status: "online" | "away" | "offline";
}

const formatTimestamp = (timestamp?: Timestamp): string => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
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

const Chats = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const activeAccount = AccountStore.getActiveAccount();

  useEffect(() => {
    const loadChats = async () => {
      if (!activeAccount?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const firestoreChats = await getChatsByAccountId(activeAccount.id);
        const displayChats: ChatDisplay[] = firestoreChats.map((chat: FirestoreChat) => ({
          id: chat.id || "",
          name: chat.isGroup ? (chat.groupName || "Group") : chat.participantNames[0] || "Unknown",
          lastMessage: chat.lastMessage || "No messages yet",
          timestamp: formatTimestamp(chat.lastMessageAt),
          unreadCount: 0,
          status: "offline" as const
        }));
        setChats(displayChats);
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [activeAccount]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleMenuClick = () => {
    navigate('/settings');
  };

  const handleNewChatClick = () => {
    navigate('/new-message');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-4">
          <div onClick={handleProfileClick} className="cursor-pointer">
            <ChatAvatar 
              name="You" 
              size="md"
              status="online"
            />
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-0 rounded-full"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleMenuClick}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-border">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-smooth"
          >
            <ChatAvatar
              name={chat.name}
              src={chat.avatar}
              status={chat.status}
              size="md"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground truncate">
                  {chat.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </span>
                  {chat.unreadCount > 0 && (
                    <Badge 
                      variant="default" 
                      className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs rounded-full px-1.5"
                    >
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {chat.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="icon"
          onClick={handleNewChatClick}
          className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Chats;