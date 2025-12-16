import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Mic, Send, Image, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";
import { getMessagesByChatId, sendMessage, updateChat, Message as FirestoreMessage } from "@/lib/firestoreService";
import { AccountStore } from "@/lib/accountStore";
import { Timestamp, serverTimestamp } from "firebase/firestore";
import { uploadChatImage, uploadChatFile, compressImage, validateFile, UploadProgress } from "@/lib/firebaseStorage";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageDisplay {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  type?: "text" | "image" | "file";
  mediaUrl?: string;
  fileName?: string;
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !activeAccount?.id) return;

    const validation = validateFile(file, { 
      maxSize: 5 * 1024 * 1024, 
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] 
    });
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      const result = await uploadChatImage(chatId, compressedFile, (progress) => {
        setUploadProgress(progress.progress);
      });

      // Send image message
      const tempId = Date.now().toString();
      const tempMessage: MessageDisplay = {
        id: tempId,
        text: "📷 Photo",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        status: "sent",
        type: "image",
        mediaUrl: result.url
      };
      setMessages(prev => [...prev, tempMessage]);

      await sendMessage({
        accountId: activeAccount.id,
        chatId: chatId,
        senderId: activeAccount.id,
        receiverId: "",
        content: result.url,
        type: "image",
        status: "sent"
      });

      await updateChat(chatId, {
        lastMessage: "📷 Photo",
        lastMessageAt: serverTimestamp() as Timestamp
      });

      toast.success("Image sent!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !activeAccount?.id) return;

    const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 });
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadChatFile(chatId, file, (progress) => {
        setUploadProgress(progress.progress);
      });

      // Send file message
      const tempId = Date.now().toString();
      const tempMessage: MessageDisplay = {
        id: tempId,
        text: `📎 ${file.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        status: "sent",
        type: "file",
        mediaUrl: result.url,
        fileName: file.name
      };
      setMessages(prev => [...prev, tempMessage]);

      await sendMessage({
        accountId: activeAccount.id,
        chatId: chatId,
        senderId: activeAccount.id,
        receiverId: "",
        content: result.url,
        type: "file",
        status: "sent"
      });

      await updateChat(chatId, {
        lastMessage: `📎 ${file.name}`,
        lastMessageAt: serverTimestamp() as Timestamp
      });

      toast.success("File sent!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

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

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-primary">Uploading... {Math.round(uploadProgress)}%</span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "image" && message.mediaUrl ? (
              <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl overflow-hidden ${message.isOwn ? 'bg-primary' : 'bg-muted'}`}>
                  <img 
                    src={message.mediaUrl} 
                    alt="Shared image" 
                    className="w-full h-auto max-h-64 object-cover cursor-pointer"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                  />
                  <div className="px-3 py-1.5 text-xs text-muted-foreground">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ) : message.type === "file" && message.mediaUrl ? (
              <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] rounded-2xl p-3 cursor-pointer ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => window.open(message.mediaUrl, '_blank')}
                >
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    <span className="truncate">{message.fileName || 'File'}</span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ) : (
              <MessageBubble
                message={message.text}
                timestamp={message.timestamp}
                isOwn={message.isOwn}
                status={message.status}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mb-1" disabled={uploading}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-2" />
                Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <File className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex-1 bg-muted rounded-full flex items-center px-4 py-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 resize-none"
              disabled={uploading}
            />
          </div>
          
          {newMessage.trim() ? (
            <Button 
              onClick={handleSendMessage}
              size="icon"
              className="bg-gradient-primary hover:opacity-90 transition-smooth rounded-full"
              disabled={uploading}
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="mb-1" disabled={uploading}>
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;