import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Bookmark, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  getSavedMessages, 
  unsaveMessage, 
  searchSavedMessages,
  SavedMessageWithDetails 
} from "@/lib/savedMessagesService";
import { chatStore } from "@/lib/chatStore";
import { format } from "date-fns";

const SavedMessageItem = ({ 
  savedMessage, 
  onUnsave, 
  onClick 
}: { 
  savedMessage: SavedMessageWithDetails; 
  onUnsave: () => void;
  onClick: () => void;
}) => {
  const [senderName, setSenderName] = useState<string>("Loading...");

  useEffect(() => {
    if (savedMessage.message?.sender_id) {
      chatStore.getProfile(savedMessage.message.sender_id).then(profile => {
        setSenderName(profile?.name || profile?.username || "Unknown");
      });
    }
  }, [savedMessage.message?.sender_id]);

  const message = savedMessage.message;
  const displayText = message?.content || 
    (message?.message_type === 'image' ? '📷 Photo' : 
     message?.message_type === 'file' ? `📎 ${message.file_name || 'File'}` : 
     'Message');

  return (
    <div 
      className="p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{senderName}</span>
            <span className="text-xs text-muted-foreground">
              {message?.created_at && format(new Date(message.created_at), 'MMM d, h:mm a')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{displayText}</p>
          {savedMessage.note && (
            <p className="text-xs text-primary mt-1 italic">Note: {savedMessage.note}</p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">
            Saved {format(new Date(savedMessage.saved_at), 'MMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onUnsave();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const SavedMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedMessages, setSavedMessages] = useState<SavedMessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadSavedMessages = useCallback(async () => {
    setLoading(true);
    try {
      const messages = searchQuery.trim() 
        ? await searchSavedMessages(searchQuery)
        : await getSavedMessages();
      setSavedMessages(messages);
    } catch (error) {
      console.error('Error loading saved messages:', error);
      toast.error('Failed to load saved messages');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadSavedMessages();
  }, [loadSavedMessages]);

  const handleUnsave = async (messageId: string) => {
    const success = await unsaveMessage(messageId);
    if (success) {
      setSavedMessages(prev => prev.filter(sm => sm.message_id !== messageId));
      toast.success('Message unsaved');
    } else {
      toast.error('Failed to unsave message');
    }
  };

  const handleClick = (savedMessage: SavedMessageWithDetails) => {
    // Navigate to the chat with the message highlighted
    navigate(`/chat/${savedMessage.chat_id}?highlight=${savedMessage.message_id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Saved Messages</h1>
          </div>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-full"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedMessages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No matching messages' : 'No saved messages'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {searchQuery 
                ? 'Try a different search term'
                : 'Long press on any message in a chat and tap "Save" to bookmark it here.'}
            </p>
          </div>
        ) : (
          <div>
            {savedMessages.map((sm) => (
              <SavedMessageItem
                key={sm.id}
                savedMessage={sm}
                onUnsave={() => handleUnsave(sm.message_id)}
                onClick={() => handleClick(sm)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedMessages;
