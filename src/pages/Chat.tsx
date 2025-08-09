import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

const mockMessages: Message[] = [
  {
    id: "1",
    text: "Hey! How's the project going?",
    timestamp: "12:30",
    isOwn: false
  },
  {
    id: "2", 
    text: "Going well! Just finished the authentication flow. Want to see?",
    timestamp: "12:32",
    isOwn: true,
    status: "read"
  },
  {
    id: "3",
    text: "Absolutely! Send it over 🚀",
    timestamp: "12:33",
    isOwn: false
  },
  {
    id: "4",
    text: "Here's the demo link. The UI looks really clean with the new design system.",
    timestamp: "12:35",
    isOwn: true,
    status: "delivered"
  }
];

const Chat = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatName = "Alex Johnson";
  const chatStatus = "online";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        status: "sent"
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <ChatAvatar
            name={chatName}
            status={chatStatus}
            size="md"
          />
          
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{chatName}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "typing..." : chatStatus}
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            timestamp={message.timestamp}
            isOwn={message.isOwn}
            status={message.status}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="icon" className="mb-1">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 bg-muted rounded-full flex items-center px-4 py-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 resize-none"
            />
          </div>
          
          {newMessage.trim() ? (
            <Button 
              onClick={handleSendMessage}
              size="icon"
              className="bg-gradient-primary hover:opacity-90 transition-smooth rounded-full"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="mb-1">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;