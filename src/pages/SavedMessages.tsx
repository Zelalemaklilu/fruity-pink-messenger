import { useState } from "react";
import { ArrowLeft, Search, Bookmark, Share, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate } from "react-router-dom";

interface SavedMessage {
  id: string;
  text: string;
  timestamp: string;
  fromChat: string;
  originalSender?: string;
}

const mockSavedMessages: SavedMessage[] = [
  {
    id: "1",
    text: "Don't forget about the meeting tomorrow at 3 PM",
    timestamp: "12:30",
    fromChat: "Alex Johnson",
    originalSender: "Alex Johnson"
  },
  {
    id: "2",
    text: "Here's the link to the project documentation: https://docs.example.com",
    timestamp: "11:45",
    fromChat: "Team Group",
    originalSender: "Sarah Williams"
  },
  {
    id: "3",
    text: "Remember to buy groceries: milk, bread, eggs, and coffee",
    timestamp: "Yesterday",
    fromChat: "Personal Notes"
  },
  {
    id: "4",
    text: "Great quote: 'The best time to plant a tree was 20 years ago. The second best time is now.'",
    timestamp: "Monday",
    fromChat: "Inspiration Group",
    originalSender: "John Smith"
  }
];

const SavedMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredMessages = mockSavedMessages.filter(message =>
    message.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.fromChat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = (message: SavedMessage) => {
    navigator.share?.({
      title: 'Shared from Zeshopp Chat',
      text: message.text
    }) || alert('Copied to clipboard!');
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Remove this saved message?')) {
      // Remove from saved messages
      alert('Message removed from saved messages');
    }
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

      {/* Saved Messages List */}
      <div className="p-4 space-y-4">
        {filteredMessages.map((message) => (
          <div key={message.id} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                From: {message.fromChat}
                {message.originalSender && ` • ${message.originalSender}`}
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleShare(message)}
                >
                  <Share className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(message.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <MessageBubble
              message={message.text}
              timestamp={message.timestamp}
              isOwn={false}
            />
          </div>
        ))}
        
        {filteredMessages.length === 0 && (
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No saved messages found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Long press on any message to save it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedMessages;