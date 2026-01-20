import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Send, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";
import { 
  subscribeToMessages, 
  sendMessage, 
  getChatById,
  getProfile,
  resetUnreadCount,
  markMessagesAsRead,
  updateChat,
  incrementUnreadCount,
  setTypingStatus,
  subscribeToTyping,
  deleteMessage,
  Message as SupabaseMessage,
  Chat as SupabaseChat,
  Profile
} from "@/lib/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { uploadChatImage, uploadChatFile, compressImage, validateFile } from "@/lib/supabaseStorage";
import { toast } from "sonner";
import { Virtuoso } from "react-virtuoso";
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
  status?: "sending" | "sent" | "delivered" | "read";
  type?: "text" | "image" | "file" | "voice";
  mediaUrl?: string;
  fileName?: string;
}

const formatTime = (timestamp?: string): string => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatInfo, setChatInfo] = useState<SupabaseChat | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [chatError, setChatError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { chatId } = useParams();
  const virtuosoRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Get other participant info
  const getOtherUserId = useCallback(() => {
    if (!chatInfo || !currentUserId) return "";
    return chatInfo.participant_1 === currentUserId 
      ? chatInfo.participant_2 
      : chatInfo.participant_1;
  }, [chatInfo, currentUserId]);

  // Load chat info
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    
    const loadChatInfo = async () => {
      try {
        const chat = await getChatById(chatId);
        
        if (!chat) {
          setChatError("Chat not found");
          setLoading(false);
          return;
        }
        
        // Verify user is a participant
        if (chat.participant_1 !== currentUserId && chat.participant_2 !== currentUserId) {
          setChatError("You don't have access to this chat");
          setLoading(false);
          return;
        }
        
        setChatInfo(chat);
        
        // Load other user's profile
        const otherUserId = chat.participant_1 === currentUserId 
          ? chat.participant_2 
          : chat.participant_1;
        const profile = await getProfile(otherUserId);
        setOtherProfile(profile);
        
        // Reset unread count
        resetUnreadCount(chatId, currentUserId).catch(console.warn);
        markMessagesAsRead(chatId, currentUserId).catch(console.warn);
        
      } catch (error) {
        console.error("Error loading chat:", error);
        setChatError("Failed to load chat");
        setLoading(false);
      }
    };
    
    loadChatInfo();
  }, [chatId, currentUserId]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId || chatError || !chatInfo || !currentUserId) return;
    
    console.log('[Chat] Subscribing to messages for chat:', chatId);
    
    const channel = subscribeToMessages(chatId, (supabaseMessages) => {
      console.log('[Chat] Received messages:', supabaseMessages.length);
      
      const displayMessages: MessageDisplay[] = supabaseMessages.map((msg: SupabaseMessage) => ({
        id: msg.id,
        text: msg.content || "",
        timestamp: formatTime(msg.created_at),
        isOwn: msg.sender_id === currentUserId,
        status: msg.status,
        type: msg.message_type,
        mediaUrl: msg.media_url || undefined,
        fileName: msg.file_name || undefined
      }));
      
      setMessages(displayMessages);
      setLoading(false);
      
      // Scroll to bottom after messages load
      if (displayMessages.length > 0) {
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ 
            index: displayMessages.length - 1, 
            behavior: 'smooth' 
          });
        }, 100);
      }
    });

    return () => {
      console.log('[Chat] Unsubscribing from messages');
      supabase.removeChannel(channel);
    };
  }, [chatId, chatError, chatInfo, currentUserId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    
    const channel = subscribeToTyping(chatId, currentUserId, (typing) => {
      setIsTyping(typing);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!chatId || !currentUserId) return;
    
    setTypingStatus(chatId, currentUserId, true).catch(console.warn);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chatId, currentUserId, false).catch(console.warn);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId || !chatInfo) return;

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    const receiverId = getOtherUserId();
    
    // Optimistic update
    const tempMessage: MessageDisplay = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sending"
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    
    // Clear typing indicator
    setTypingStatus(chatId, currentUserId, false).catch(console.warn);

    try {
      await sendMessage(chatId, currentUserId, receiverId, messageText);
      
      // Update chat metadata
      updateChat(chatId, {
        last_message: messageText,
        last_message_time: new Date().toISOString(),
        last_sender_id: currentUserId
      }).catch(console.warn);

      // Increment unread for receiver
      incrementUnreadCount(chatId, receiverId).catch(console.warn);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Failed to send message");
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
    if (!file || !chatId || !currentUserId) return;

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
      const compressedFile = await compressImage(file);
      const result = await uploadChatImage(chatId, compressedFile, (progress) => {
        setUploadProgress(progress.percentage);
      });

      const receiverId = getOtherUserId();
      await sendMessage(chatId, currentUserId, receiverId, "", "image", result.url);

      updateChat(chatId, {
        last_message: "📷 Photo",
        last_message_time: new Date().toISOString(),
        last_sender_id: currentUserId
      }).catch(console.warn);

      incrementUnreadCount(chatId, receiverId).catch(console.warn);
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
    if (!file || !chatId || !currentUserId) return;

    const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 });
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadChatFile(chatId, file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      const receiverId = getOtherUserId();
      await sendMessage(chatId, currentUserId, receiverId, "", "file", result.url, file.name);

      updateChat(chatId, {
        last_message: `📎 ${file.name}`,
        last_message_time: new Date().toISOString(),
        last_sender_id: currentUserId
      }).catch(console.warn);

      incrementUnreadCount(chatId, receiverId).catch(console.warn);
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

  const handleDeleteMessage = async (messageId: string) => {
    const success = await deleteMessage(messageId);
    if (success) {
      toast.success("Message deleted");
    } else {
      toast.error("Failed to delete message");
    }
  };

  const chatName = otherProfile?.name || otherProfile?.username || "Chat";
  const chatAvatar = otherProfile?.avatar_url || "";

  // Error state
  if (chatError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 z-10">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-foreground">Error</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{chatError}</p>
            <Button onClick={() => navigate("/chats")}>Back to Chats</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ChatAvatar name={chatName} src={chatAvatar} status={otherProfile?.is_online ? "online" : "offline"} size="md" />
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{chatName}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "typing..." : otherProfile?.is_online ? "online" : "offline"}
            </p>
          </div>
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

      {/* Upload Progress */}
      {uploading && (
        <div className="px-4 py-2 bg-muted/50">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1 mt-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all" 
              style={{ width: `${uploadProgress}%` }} 
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: '100%', width: '100%' }}
              data={messages}
              overscan={200}
              itemContent={(index, message) => (
                <div className="px-4 py-1">
                  <MessageBubble
                    message={message.text}
                    timestamp={message.timestamp}
                    isOwn={message.isOwn}
                    status={message.status === 'sending' ? 'sent' : message.status}
                    type={message.type}
                    mediaUrl={message.mediaUrl}
                    fileName={message.fileName}
                    onDelete={message.isOwn ? () => handleDeleteMessage(message.id) : undefined}
                  />
                </div>
              )}
              followOutput="smooth"
              initialTopMostItemIndex={messages.length - 1}
              alignToBottom
            />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={uploading}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-2" />
                Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <File className="h-4 w-4 mr-2" />
                File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full"
            disabled={uploading}
          />
          
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || uploading}
            className="rounded-full bg-gradient-primary"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
