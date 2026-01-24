import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, MoreVertical, Paperclip, Send, Image, File, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";
import { useMessages, useTypingIndicator, useProfile, useChatInfo } from "@/hooks/useChatStore";
import { chatStore } from "@/lib/chatStore";
import { uploadChatImage, uploadChatFile, compressImage, validateFile } from "@/lib/supabaseStorage";
import { toast } from "sonner";
import { Virtuoso } from "react-virtuoso";
import { CallButton } from "@/components/call/CallButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSearch } from "@/components/chat/MessageSearch";

// =============================================
// TYPES
// =============================================

interface MessageDisplay {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  type?: "text" | "image" | "file" | "voice";
  mediaUrl?: string;
  fileName?: string;
  isOptimistic?: boolean;
  isFailed?: boolean;
}

// =============================================
// UTILITIES
// =============================================

const formatTime = (timestamp?: string): string => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// =============================================
// MAIN COMPONENT
// =============================================

const Chat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { chatId } = useParams();
  const virtuosoRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrolledRef = useRef(false);

  // Get current user
  const currentUserId = chatStore.getCurrentUserId();

  // Use cached hooks
  const { chat, otherUserId, loading: chatLoading } = useChatInfo(chatId);
  const { profile: otherProfile, loading: profileLoading } = useProfile(otherUserId || undefined);
  const { messages: rawMessages, loading: messagesLoading, sendMessage, deleteMessage } = useMessages(chatId);
  const { typingUsers, setTyping } = useTypingIndicator(chatId);

  // Transform messages for display (memoized)
  const messages: MessageDisplay[] = useMemo(() => {
    return rawMessages.map((msg) => ({
      id: msg.id,
      text: msg.content || "",
      timestamp: formatTime(msg.created_at),
      isOwn: msg.sender_id === currentUserId,
      status: msg.status,
      type: msg.message_type,
      mediaUrl: msg.media_url || undefined,
      fileName: msg.file_name || undefined,
      isOptimistic: msg._optimistic,
      isFailed: msg._failed,
    }));
  }, [rawMessages, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && virtuosoRef.current && !highlightedMessageId) {
      // Only auto-scroll if we haven't manually scrolled or it's a new message
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ 
          index: messages.length - 1, 
          behavior: scrolledRef.current ? 'smooth' : 'auto'
        });
        scrolledRef.current = true;
      }, 50);
    }
  }, [messages.length, highlightedMessageId]);

  // Handle search result selection - scroll to message
  const handleSearchResultSelect = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
    
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex >= 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messageIndex,
        behavior: 'smooth',
        align: 'center'
      });
    }

    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
  }, [messages]);

  // Close search
  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    setHighlightedMessageId(null);
  }, []);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Send text message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const success = await sendMessage(messageText);
    if (!success) {
      toast.error("Failed to send message");
    }
  }, [newMessage, sendMessage, setTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

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

      const success = await sendMessage("", "image", result.url);
      if (success) {
        toast.success("Image sent!");
      } else {
        toast.error("Failed to send image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

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

      const success = await sendMessage("", "file", result.url, file.name);
      if (success) {
        toast.success("File sent!");
      } else {
        toast.error("Failed to send file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    const success = await deleteMessage(messageId);
    if (success) {
      toast.success("Message deleted");
    } else {
      toast.error("Failed to delete message");
    }
  };

  // Derived state
  const chatName = otherProfile?.name || otherProfile?.username || "Chat";
  const chatAvatar = otherProfile?.avatar_url || "";
  const isOnline = otherProfile?.is_online || false;
  const isTyping = typingUsers.length > 0;
  
  // Only show loading if we have NO cached data at all
  const hasCachedMessages = messages.length > 0;
  const hasCachedChat = !!chat;
  const isLoading = !hasCachedMessages && !hasCachedChat && (chatLoading || messagesLoading);

  // Error state - only show if not loading AND truly no access (give it time)
  // Don't show error immediately - wait for store to be ready
  if (!chatLoading && !messagesLoading && !chat && chatId && currentUserId) {
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
            <p className="text-muted-foreground">Chat not found or you don't have access</p>
            <Button onClick={() => navigate("/chats")}>Back to Chats</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ChatAvatar 
            name={chatName} 
            src={chatAvatar} 
            status={isOnline ? "online" : "offline"} 
            size="md" 
          />
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{chatName}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "typing..." : isOnline ? "online" : "offline"}
            </p>
          </div>
          {otherUserId && (
            <CallButton
              peerId={otherUserId}
              peerName={chatName}
              peerAvatar={chatAvatar}
              variant="icon"
            />
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && chatId && (
        <MessageSearch 
          chatId={chatId}
          onResultSelect={handleSearchResultSelect}
          onClose={handleCloseSearch}
        />
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex-shrink-0 px-4 py-2 bg-muted/50">
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

      {/* Messages - show cached content immediately, loading spinner only when truly empty */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {messages.length === 0 && isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="h-full w-full"
            data={messages}
            overscan={200}
            itemContent={(index, message) => (
              <div 
                className={`px-4 py-1 transition-all duration-300 ${
                  highlightedMessageId === message.id 
                    ? 'bg-primary/20 ring-2 ring-primary/40 rounded-lg' 
                    : ''
                }`}
              >
                <MessageBubble
                  message={message.text}
                  timestamp={message.timestamp}
                  isOwn={message.isOwn}
                  status={message.status === 'sending' ? 'sent' : message.status}
                  type={message.type}
                  mediaUrl={message.mediaUrl}
                  fileName={message.fileName}
                  onDelete={message.isOwn && !message.isOptimistic ? () => handleDeleteMessage(message.id) : undefined}
                  className={message.isFailed ? "opacity-50" : ""}
                />
              </div>
            )}
            followOutput="smooth"
            initialTopMostItemIndex={messages.length - 1}
            alignToBottom
          />
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-background border-t border-border p-4">
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
            className="flex-1 bg-muted border-0 rounded-full"
            disabled={uploading}
          />

          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || uploading}
            className="rounded-full bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
