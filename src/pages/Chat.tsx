import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";
import { getMessagesByChatId, sendMessage, updateChat, Message as FirestoreMessage } from "@/lib/firestoreService";
import { AccountStore } from "@/lib/accountStore";
import { Timestamp, serverTimestamp } from "firebase/firestore";

interface MessageDisplay {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

const formatTime = (timestamp?: Timestamp): string => {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeAccount = AccountStore.getActiveAccount();

  const chatName = "Chat";
  const chatStatus = "online";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      try {
        const firestoreMessages = await getMessagesByChatId(chatId);
        const displayMessages: MessageDisplay[] = firestoreMessages.map((msg: FirestoreMessage) => ({
          id: msg.id || "",
          text: msg.content,
          timestamp: formatTime(msg.createdAt),
          isOwn: msg.senderId === activeAccount?.id,
          status: msg.status
        }));
        setMessages(displayMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatId, activeAccount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !activeAccount?.id) return;

    const messageText = newMessage.trim();
    const tempId = Date.now().toString();
    
    // Optimistic update
    const tempMessage: MessageDisplay = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sent"
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      await sendMessage({
        accountId: activeAccount.id,
        chatId: chatId,
        senderId: activeAccount.id,
        receiverId: "", // Will be set based on chat participants
        content: messageText,
        type: "text",
        status: "sent"
      });

      // Update chat's last message
      await updateChat(chatId, {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error("Error sending message:", error);
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