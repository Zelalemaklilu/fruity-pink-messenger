import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Megaphone, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getMyChannels,
  getSubscribedChannels,
  createChannel,
  type Channel,
} from "@/lib/channelService";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Channels = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [version, setVersion] = useState(0);

  const myChannels = userId ? getMyChannels(userId) : [];
  const subscribedChannels = userId ? getSubscribedChannels(userId) : [];

  const filterChannels = (channels: Channel[]) => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  };

  const filteredMy = filterChannels(myChannels);
  const filteredSubscribed = filterChannels(subscribedChannels);
  const isEmpty = filteredMy.length === 0 && filteredSubscribed.length === 0;

  const handleCreate = () => {
    if (!channelName.trim()) {
      toast.error("Channel name is required");
      return;
    }
    if (!userId) return;
    createChannel(channelName.trim(), channelDescription.trim(), userId);
    toast.success("Channel created");
    setChannelName("");
    setChannelDescription("");
    setDialogOpen(false);
    setVersion((v) => v + 1);
  };

  const renderChannelCard = (channel: Channel, index: number) => (
    <motion.div
      key={channel.id}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={() => navigate(`/channel/${channel.id}`)}
      className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover-elevate active-elevate-2"
      data-testid={`card-channel-${channel.id}`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-base shrink-0"
        style={{ backgroundColor: channel.avatarColor }}
      >
        {channel.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {channel.name}
        </h3>
        {channel.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {channel.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-muted-foreground shrink-0">
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs">{channel.subscriberCount}</span>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="page-channels">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-50"
      >
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-foreground">Channels</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDialogOpen(true)}
            data-testid="button-create-channel"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-channels"
          />
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {isEmpty && !searchQuery && (
          <div className="flex flex-col items-center justify-center pt-24 gap-4 text-muted-foreground">
            <Megaphone className="h-16 w-16 opacity-30" />
            <p className="text-base font-medium" data-testid="text-empty-channels">
              No channels yet
            </p>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
              data-testid="button-create-channel-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </div>
        )}

        {isEmpty && searchQuery && (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-muted-foreground">
            <Search className="h-12 w-12 opacity-30" />
            <p className="text-sm">No channels match your search</p>
          </div>
        )}

        {filteredMy.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              My Channels
            </h2>
            <div className="space-y-1">
              {filteredMy.map((c, i) => renderChannelCard(c, i))}
            </div>
          </div>
        )}

        {filteredSubscribed.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Subscribed
            </h2>
            <div className="space-y-1">
              {filteredSubscribed.map((c, i) => renderChannelCard(c, i))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Name</Label>
              <Input
                id="channel-name"
                placeholder="Channel name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                data-testid="input-channel-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-desc">Description</Label>
              <Input
                id="channel-desc"
                placeholder="What is this channel about?"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                data-testid="input-channel-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} data-testid="button-confirm-create">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Channels;
