import { useState } from "react";
import { ArrowLeft, Search, Bookmark, Share, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Note: Saved messages feature requires a dedicated database table
// This is a UI-ready component that will work once the backend is added

const SavedMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Placeholder - in full implementation, this would fetch from a saved_messages table
  const savedMessages: any[] = [];

  const filteredMessages = savedMessages.filter(message =>
    message.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = (message: any) => {
    navigator.share?.({
      title: 'Shared from Zeshopp Chat',
      text: message.text
    }) || toast.info('Share feature not supported on this device');
  };

  const handleDelete = (messageId: string) => {
    toast.info('Delete feature coming soon');
  };

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

      {/* Empty State */}
      <div className="p-4">
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No saved messages</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Long press on any message in a chat to save it here for quick access later.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            This feature is coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SavedMessages;
