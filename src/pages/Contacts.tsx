import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore, Chat, PublicProfile } from "@/lib/chatStore";
import { searchUsers, findOrCreateChat } from "@/lib/supabaseService";
import { toast } from "sonner";

// Contact item that loads profile data
interface ContactItemProps {
  userId: string;
  onClick: (userId: string) => void;
}

const ContactItem = ({ userId, onClick }: ContactItemProps) => {
  const { profile, loading } = useProfile(userId);
  
  if (loading || !profile) {
    return (
      <div className="flex items-center space-x-3 p-4">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
          <div className="h-3 bg-muted rounded animate-pulse w-24" />
        </div>
      </div>
    );
  }
  
  return (
    <div
      onClick={() => onClick(userId)}
      className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-smooth"
    >
      <ChatAvatar
        name={profile.name || profile.username}
        src={profile.avatar_url || undefined}
        status={profile.is_online ? "online" : "offline"}
        size="md"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {profile.name || profile.username}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          @{profile.username}
        </p>
      </div>
    </div>
  );
};

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  
  // Get contacts from existing chats
  const { chats, loading } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();
  
  // Extract unique contact IDs from chats
  const contactIds = Array.from(new Set(
    chats.map(chat => chatStore.getOtherUserId(chat))
  )).filter(id => id && id !== currentUserId);

  // Search users in backend
  useEffect(() => {
    const search = async () => {
      const query = searchQuery.trim();
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const results = await searchUsers(query);
        // Filter out current user
        setSearchResults(results.filter(u => u.id !== currentUserId));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    };
    
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, currentUserId]);

  const handleContactClick = async (userId: string) => {
    if (!currentUserId) return;
    
    // Find or create chat with this user
    const chatId = await findOrCreateChat(currentUserId, userId);
    if (chatId) {
      navigate(`/chat/${chatId}`);
    } else {
      toast.error("Failed to open chat");
    }
  };

  const handleSearchResultClick = async (user: PublicProfile) => {
    if (!currentUserId) return;
    
    const chatId = await findOrCreateChat(currentUserId, user.id);
    if (chatId) {
      navigate(`/chat/${chatId}`);
      toast.success(`Chat with @${user.username} opened`);
    } else {
      toast.error("Failed to start chat");
    }
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Contacts</h1>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-full"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Search Results</h3>
          {searching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found for "{searchQuery}"
            </p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSearchResultClick(user)}
                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer rounded-lg transition-smooth"
                >
                  <ChatAvatar
                    name={user.name || user.username}
                    src={user.avatar_url || undefined}
                    status={user.is_online ? "online" : "offline"}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.name || user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing Contacts */}
      {!showSearchResults && (
        <>
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Your Contacts ({contactIds.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contactIds.length === 0 ? (
            <div className="text-center py-12 px-4">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No contacts yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Search for users by username to start chatting
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contactIds.map((userId) => (
                <ContactItem
                  key={userId}
                  userId={userId}
                  onClick={handleContactClick}
                />
              ))}
            </div>
          )}
        </>
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

export default Contacts;
