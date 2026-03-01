import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Eye,
  Megaphone,
  Users,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  getChannel,
  getChannelMessages,
  sendChannelMessage,
  deleteChannelMessage,
  deleteChannel,
  updateChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  isSubscribed,
  getSubscriberCount,
  type Channel,
  type ChannelMessage,
} from "@/lib/channelService";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

const ChannelView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userId, user } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOwner = channel?.createdBy === userId;

  const reload = () => {
    if (!id) return;
    const ch = getChannel(id);
    if (!ch) {
      toast.error("Channel not found");
      navigate("/channels");
      return;
    }
    setChannel(ch);
    setMessages(getChannelMessages(id));
    if (userId) {
      setSubscribed(isSubscribed(id, userId));
    }
    setSubCount(getSubscriberCount(id));
  };

  useEffect(() => {
    reload();
  }, [id, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !id || !userId) return;
    const senderName =
      (user as any)?.user_metadata?.name ||
      (user as any)?.user_metadata?.username ||
      (user as any)?.email ||
      "Admin";
    sendChannelMessage(id, newMessage.trim(), userId, senderName);
    setNewMessage("");
    reload();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSubscribeToggle = () => {
    if (!id || !userId) return;
    if (subscribed) {
      unsubscribeFromChannel(id, userId);
      toast.success("Unsubscribed");
    } else {
      subscribeToChannel(id, userId);
      toast.success("Subscribed");
    }
    reload();
  };

  const handleDelete = () => {
    if (!id) return;
    deleteChannel(id);
    toast.success("Channel deleted");
    navigate("/channels");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!id) return;
    deleteChannelMessage(id, messageId);
    reload();
  };

  const handleEditOpen = () => {
    if (!channel) return;
    setEditName(channel.name);
    setEditDescription(channel.description);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!id || !editName.trim()) {
      toast.error("Name is required");
      return;
    }
    updateChannel(id, {
      name: editName.trim(),
      description: editDescription.trim(),
    });
    toast.success("Channel updated");
    setEditDialogOpen(false);
    reload();
  };

  if (!channel) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">Channel not found</p>
        <Button onClick={() => navigate("/channels")} data-testid="button-back-channels">
          Back to Channels
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" data-testid="page-channel-view">
      <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border p-4 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/channels")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
            style={{ backgroundColor: channel.avatarColor }}
          >
            {channel.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate text-sm">
              {channel.name}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {subCount} subscriber{subCount !== 1 ? "s" : ""}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-channel-menu">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <DropdownMenuItem onClick={handleEditOpen} data-testid="menu-edit-channel">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Channel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleSubscribeToggle}
                data-testid="menu-subscribe-toggle"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                {subscribed ? "Unsubscribe" : "Subscribe"}
              </DropdownMenuItem>
              {isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    data-testid="menu-delete-channel"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Channel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Megaphone className="h-12 w-12 opacity-30" />
            <p className="text-sm" data-testid="text-no-messages">
              No messages yet
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
            className={cn(
              "rounded-lg p-3 border border-border",
              msg.type === "announcement"
                ? "bg-primary/10 border-primary/30"
                : "bg-card"
            )}
            data-testid={`message-${msg.id}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {msg.type === "announcement" && (
                  <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground truncate">
                  {msg.senderName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                </span>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteMessage(msg.id)}
                    data-testid={`button-delete-message-${msg.id}`}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {msg.content}
            </p>
            <div className="flex items-center gap-1 mt-2 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span className="text-[10px]">{msg.views}</span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isOwner && (
        <div className="flex-shrink-0 border-t border-border p-3 bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Write a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              data-testid="input-channel-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                data-testid="input-edit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} data-testid="button-save-edit">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelView;
