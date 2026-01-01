import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Mic, Send, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { MessageBubble } from "@/components/ui/message-bubble";
import { useNavigate, useParams } from "react-router-dom";
import { 
  subscribeToMessages, 
  sendMessage, 
  updateChat, 
  getChatById,
  resetUnreadCount,
  incrementUnreadCount,
  Message as FirestoreMessage,
  Chat as FirestoreChat
} from "@/lib/firestoreService";
import { auth } from "@/lib/firebase";
import { Timestamp, serverTimestamp } from "firebase/firestore";
import { uploadChatImage, uploadChatFile, compressImage, validateFile } from "@/lib/firebaseStorage";
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

const formatTime = (timestamp?: Timestamp): string => {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatInfo, setChatInfo] = useState<FirestoreChat | null>(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const virtuosoRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentoderId = auth.currentUser?.uid || localStorage.getItem("firebaseUserId") || "";

  // Get other participant's name
  const getOtherParticipantName = useCallback(() => {
    if (!chatInfo) return "Chat";
    const idx = chatInfo.participants?.indexOf(currentoderId);
    if (idx === -1 || idx === undefined) return chatInfo.participantNames?.[0] || "Chat";
    const otherIdx = idx === 0 ? 1 : 0;
    return chatInfo.participantNames?.[otherIdx] || "Chat";
  }, [chatInfo, currentoderId]);

  const getOtherParticipantAvatar = useCallback(() => {
    if (!chatInfo) return "";
    const idx = chatInfo.participants?.indexOf(currentoderId);
    if (idx === -1 || idx === undefined) return chatInfo.participantAvatars?.[0] || "";
    const otherIdx = idx === 0 ? 1 : 0;
    return chatInfo.participantAvatars?.[otherIdx] || "";
  }, [chatInfo, currentoderId]);

  const getOtherParticipantId = useCallback(() => {
    if (!chatInfo) return "";
    const idx = chatInfo.participants?.indexOf(currentoderId);
    if (idx === -1 || idx === undefined) return chatInfo.participants?.[0] || "";
    const otherIdx = idx === 0 ? 1 : 0;
    return chatInfo.participants?.[otherIdx] || "";
  }, [chatInfo, currentoderId]);

  // Load chat info and reset unread count
  useEffect(() => {
    const loadChatInfo = async () => {
      if (!chatId) return;
      const chat = await getChatById(chatId);
      setChatInfo(chat);
      
      // Reset unread count when opening chat
      if (currentoderId) {
        await resetUnreadCount(chatId, currentoderId);
      }
    };
    loadChatInfo();
  }, [chatId, currentoderId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (firestoreMessages) => {
      const displayMessages: MessageDisplay[] = firestoreMessages.map((msg: FirestoreMessage) => ({
        id: msg.id || msg.tempId || "",
        text: msg.content,
        timestamp: formatTime(msg.createdAt),
        isOwn: msg.senderId === currentoderId,
        status: msg.status,
        type: msg.type,
        mediaUrl: msg.type === 'image' || msg.type === 'file' ? msg.content : undefined,
        fileName: msg.fileName
      }));
      setMessages(displayMessages);
      setLoading(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: displayMessages.length - 1, behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, currentoderId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentoderId) return;

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    const receiverId = getOtherParticipantId();
    
    // Optimistic update - show message instantly
    const tempMessage: MessageDisplay = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sending"
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    try {
      await sendMessage({
        accountId: currentoderId,
        chatId: chatId,
        senderId: currentoderId,
        receiverId: receiverId,
        content: messageText,
        type: "text",
        status: "sent",
        tempId: tempId
      });

      // Update chat's last message and increment unread for recipient
      await updateChat(chatId, {
        lastMessage: messageText,
        lastMessageTimestamp: serverTimestamp() as Timestamp,
        lastMessageAt: serverTimestamp() as Timestamp
      });

      // Increment unread count for recipient
      if (receiverId) {
        await incrementUnreadCount(chatId, receiverId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
    if (!file || !chatId || !currentoderId) return;

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
        setUploadProgress(progress.progress);
      });

      const receiverId = getOtherParticipantId();

      await sendMessage({
        accountId: currentoderId,
        chatId: chatId,
        senderId: currentoderId,
        receiverId: receiverId,
        content: result.url,
        type: "image",
        status: "sent"
      });

      await updateChat(chatId, {
        lastMessage: "📷 Photo",
        lastMessageTimestamp: serverTimestamp() as Timestamp,
        lastMessageAt: serverTimestamp() as Timestamp
      });

      if (receiverId) {
        await incrementUnreadCount(chatId, receiverId);
      }

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
    if (!file || !chatId || !currentoderId) return;

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

      const receiverId = getOtherParticipantId();

      await sendMessage({
        accountId: currentoderId,
        chatId: chatId,
        senderId: currentoderId,
        receiverId: receiverId,
        content: result.url,
        type: "file",
        status: "sent",
        fileName: file.name
      });

      await updateChat(chatId, {
        lastMessage: `📎 ${file.name}`,
        lastMessageTimestamp: serverTimestamp() as Timestamp,
        lastMessageAt: serverTimestamp() as Timestamp
      });

      if (receiverId) {
        await incrementUnreadCount(chatId, receiverId);
      }

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

  const chatName = getOtherParticipantName();
  const chatAvatar = getOtherParticipantAvatar();

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
          <ChatAvatar name={chatName} src={chatAvatar} status="online" size="md" />
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{chatName}</h2>
            <p className="text-xs text-muted-foreground">{isTyping ? "typing..." : "online"}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-primary">Uploading... {Math.round(uploadProgress)}%</span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Messages with Virtualization */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            followOutput="smooth"
            itemContent={(_, message) => (
              <div className="px-4 py-1">
                {message.type === "image" && message.mediaUrl ? (
                  <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl overflow-hidden ${message.isOwn ? 'bg-primary' : 'bg-muted'}`}>
                      <img src={message.mediaUrl} alt="Shared" className="w-full h-auto max-h-64 object-cover cursor-pointer" onClick={() => window.open(message.mediaUrl, '_blank')} />
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">{message.timestamp}</div>
                    </div>
                  </div>
                ) : message.type === "file" && message.mediaUrl ? (
                  <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 cursor-pointer ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={() => window.open(message.mediaUrl, '_blank')}>
                      <div className="flex items-center gap-2"><File className="h-5 w-5" /><span className="truncate">{message.fileName || 'File'}</span></div>
                      <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                    </div>
                  </div>
                ) : (
                  <MessageBubble message={message.text} timestamp={message.timestamp} isOwn={message.isOwn} status={message.status === 'sending' ? 'sent' : message.status} />
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mb-1" disabled={uploading}><Paperclip className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}><Image className="h-4 w-4 mr-2" />Photo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}><File className="h-4 w-4 mr-2" />Document</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 bg-muted rounded-full flex items-center px-4 py-2">
            <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 resize-none" disabled={uploading} />
          </div>
          {newMessage.trim() ? (
            <Button onClick={handleSendMessage} size="icon" className="bg-gradient-primary hover:opacity-90 transition-smooth rounded-full" disabled={uploading}><Send className="h-5 w-5" /></Button>
          ) : (
            <Button variant="ghost" size="icon" className="mb-1" disabled={uploading}><Mic className="h-5 w-5" /></Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
