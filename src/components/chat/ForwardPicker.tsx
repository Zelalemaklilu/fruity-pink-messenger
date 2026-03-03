import { useState, useEffect } from "react";
import { X, Search, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { motion, AnimatePresence } from "framer-motion";
import { chatStore, Chat } from "@/lib/chatStore";
import { useProfile } from "@/hooks/useChatStore";
import { toast } from "sonner";

interface ForwardPickerProps {
  messageText: string;
  messageType?: string;
  mediaUrl?: string;
  onClose: () => void;
}

const ForwardChatItem = ({
  chat,
  selected,
  onSelect
}: {
  chat: Chat;
  selected: boolean;
  onSelect: (chatId: string) => void;
}) => {
  const otherUserId = chatStore.getOtherUserId(chat);
  const { profile } = useProfile(otherUserId);
  const name = profile?.name || profile?.username || "Loading...";
  const avatar = profile?.avatar_url || "";

  return (
    <div
      data-testid={`forward-chat-${chat.id}`}
      onClick={() => onSelect(chat.id)}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors rounded-lg ${
        selected ? "bg-primary/15" : "hover:bg-muted/50"
      }`}
    >
      <ChatAvatar name={name} src={avatar} size="sm" />
      <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Send className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      )}
    </div>
  );
};

export function ForwardPicker({ messageText, messageType, mediaUrl, onClose }: ForwardPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const allChats = chatStore.getChatList();
    setChats(allChats);
  }, []);

  const filteredChats = search.trim()
    ? chats.filter(chat => {
        const otherUserId = chatStore.getOtherUserId(chat);
        const profile = chatStore.getCachedProfile(otherUserId);
        const name = (profile?.name || profile?.username || "").toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : chats;

  const toggleChat = (chatId: string) => {
    setSelectedChats(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  const handleForward = async () => {
    if (selectedChats.size === 0) return;
    setSending(true);

    let successCount = 0;
    for (const chatId of selectedChats) {
      try {
        const forwardText = messageType === "image" && mediaUrl
          ? `[Forwarded Image] ${messageText || mediaUrl}`
          : messageText;

        await chatStore.sendMessage(chatId, forwardText, "text");
        successCount++;
      } catch {
      }
    }

    setSending(false);
    if (successCount > 0) {
      toast.success(`Forwarded to ${successCount} chat${successCount > 1 ? "s" : ""}`);
    } else {
      toast.error("Failed to forward message");
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Forward to...</h3>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-forward">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-forward-search"
              placeholder="Search chats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredChats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No chats found</p>
          ) : (
            filteredChats.map(chat => (
              <ForwardChatItem
                key={chat.id}
                chat={chat}
                selected={selectedChats.has(chat.id)}
                onSelect={toggleChat}
              />
            ))
          )}
        </div>

        {selectedChats.size > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 border-t border-border"
          >
            <Button
              data-testid="button-forward-send"
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleForward}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Forward to {selectedChats.size} chat{selectedChats.size > 1 ? "s" : ""}
            </Button>
          </motion.div>
        )}

        <div className="p-3 border-t border-border bg-muted/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {messageText || "[Media]"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
