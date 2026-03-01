import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, MoreVertical, Send, Loader2, Users, UserPlus, LogOut, Timer, Shield, MessageSquare, Hash, Plus, Trash2, Pin, Lock, Unlock, Volume2, VolumeX, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Virtuoso } from "react-virtuoso";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getGroup,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  deleteGroupMessage,
  subscribeToGroupMessages,
  unsubscribeFromGroupMessages,
  isGroupAdmin,
  removeGroupMember,
  Group,
  GroupMember,
  GroupMessage,
} from "@/lib/groupService";
import { chatStore } from "@/lib/chatStore";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { getSlowMode, setSlowMode as setSlowModeConfig, canSendMessage, recordMessageSent, SLOW_MODE_OPTIONS, getSlowModeLabel } from "@/lib/slowModeService";
import { getGroupPermissions, setGroupPermissions, isMemberMuted, muteMember, unmuteMember, type GroupPermissions } from "@/lib/adminService";
import { getTopics, createTopic, deleteTopic, togglePinTopic, getTopicMessages, addTopicMessage, TOPIC_ICONS, TOPIC_COLORS, type Topic, type TopicMessage } from "@/lib/topicService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Message display component
interface GroupMessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  senderName: string;
  onDelete?: () => void;
}

const GroupMessageBubble = ({ message, isOwn, senderName, onDelete }: GroupMessageBubbleProps) => {
  const timestamp = format(new Date(message.created_at), 'h:mm a');

  const locationMatch = message.content?.match(/\[location:(-?\d+\.?\d*),(-?\d+\.?\d*)\]/);

  const renderContent = () => {
    if (locationMatch) {
      const lat = parseFloat(locationMatch[1]);
      const lng = parseFloat(locationMatch[2]);
      return (
        <div className="rounded-md overflow-visible">
          <div className="rounded-t-md overflow-hidden">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`}
              width="240"
              height="120"
              className="border-0 block"
              title="Shared location"
              loading="lazy"
            />
          </div>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary mt-1 inline-block"
            data-testid="link-open-maps"
          >
            Open in Maps
          </a>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
        isOwn 
          ? "bg-chat-bubble-outgoing text-chat-text-outgoing" 
          : "bg-chat-bubble-incoming text-chat-text-incoming"
      }`}>
        {!isOwn && (
          <p className="text-xs font-medium text-primary mb-1">{senderName}</p>
        )}
        {renderContent()}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

// Member list item
interface MemberItemProps {
  member: GroupMember;
  isAdmin: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

const MemberItem = ({ member, isAdmin, canRemove, onRemove }: MemberItemProps) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    chatStore.getProfile(member.user_id).then(setProfile);
  }, [member.user_id]);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <ChatAvatar
          name={profile?.name || profile?.username || "User"}
          src={profile?.avatar_url}
          size="sm"
        />
        <div>
          <p className="text-sm font-medium">
            {profile?.name || profile?.username || "Loading..."}
          </p>
          {member.role === 'admin' && (
            <span className="text-xs text-primary">Admin</span>
          )}
        </div>
      </div>
      {canRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
          Remove
        </Button>
      )}
    </div>
  );
};

const GroupChat = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Map<string, any>>(new Map());
  const [slowModeInterval, setSlowModeInterval] = useState(0);
  const [slowModeCooldown, setSlowModeCooldown] = useState(0);
  const [permissions, setPermissions] = useState<GroupPermissions | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicMessages, setTopicMessages] = useState<TopicMessage[]>([]);
  const [newTopicMessage, setNewTopicMessage] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTopicCreator, setShowTopicCreator] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicIcon, setNewTopicIcon] = useState("MessageSquare");
  const [newTopicColor, setNewTopicColor] = useState("hsl(210, 90%, 60%)");

  const navigate = useNavigate();
  const { groupId } = useParams();
  const { userId } = useAuth();
  const virtuosoRef = useRef<any>(null);

  // Load group data
  useEffect(() => {
    if (!groupId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [groupData, membersData, messagesData, adminStatus] = await Promise.all([
          getGroup(groupId),
          getGroupMembers(groupId),
          getGroupMessages(groupId),
          isGroupAdmin(groupId),
        ]);

        if (!groupData) {
          toast.error('Group not found or you do not have access');
          navigate('/chats');
          return;
        }

        setGroup(groupData);
        setMembers(membersData);
        setMessages(messagesData);
        setUserIsAdmin(adminStatus);

        const sm = getSlowMode(groupId);
        setSlowModeInterval(sm?.intervalSeconds || 0);
        setPermissions(getGroupPermissions(groupId));
        setTopics(getTopics(groupId));

        // Load member profiles
        const profiles = new Map();
        await Promise.all(
          membersData.map(async (m) => {
            const profile = await chatStore.getProfile(m.user_id);
            if (profile) profiles.set(m.user_id, profile);
          })
        );
        setMemberProfiles(profiles);
      } catch (error) {
        console.error('Error loading group:', error);
        toast.error('Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, navigate]);

  // Subscribe to new messages
  useEffect(() => {
    if (!groupId) return;

    const channel = subscribeToGroupMessages(groupId, (newMsg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => unsubscribeFromGroupMessages(channel);
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && virtuosoRef.current) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ 
          index: messages.length - 1, 
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [messages.length]);

  // Slow mode cooldown timer
  useEffect(() => {
    if (!groupId || !userId || slowModeInterval === 0) {
      setSlowModeCooldown(0);
      return;
    }
    const check = () => {
      const result = canSendMessage(groupId, userId);
      setSlowModeCooldown(result.allowed ? 0 : result.remainingSeconds);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [groupId, userId, slowModeInterval, messages.length]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !groupId) return;

    if (groupId && userId && slowModeInterval > 0) {
      const result = canSendMessage(groupId, userId);
      if (!result.allowed) {
        toast.error(`Please wait ${result.remainingSeconds}s (slow mode)`);
        return;
      }
    }

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sent = await sendGroupMessage(groupId, content);
      if (!sent) {
        toast.error('Failed to send message');
      }
      if (groupId && userId) recordMessageSent(groupId, userId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    const success = await removeGroupMember(groupId, memberId);
    if (success) {
      setMembers(prev => prev.filter(m => m.user_id !== memberId));
      toast.success('Member removed');
    } else {
      toast.error('Failed to remove member');
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!groupId || !userId) return;
    const success = await removeGroupMember(groupId, userId);
    if (success) {
      toast.success('You left the group');
      navigate('/chats');
    } else {
      toast.error('Failed to leave group');
    }
  };

  const handleSetSlowMode = useCallback((seconds: number) => {
    if (!groupId) return;
    setSlowModeConfig(groupId, seconds);
    setSlowModeInterval(seconds);
    toast.success(seconds === 0 ? "Slow mode disabled" : `Slow mode: ${getSlowModeLabel(seconds)}`);
  }, [groupId]);

  const handleTogglePermission = useCallback((key: keyof GroupPermissions, value: boolean) => {
    if (!groupId) return;
    setGroupPermissions(groupId, { [key]: value });
    setPermissions(getGroupPermissions(groupId));
  }, [groupId]);

  const handleToggleMuteMember = useCallback((memberId: string) => {
    if (!groupId) return;
    if (isMemberMuted(groupId, memberId)) {
      unmuteMember(groupId, memberId);
      toast.success("Member unmuted");
    } else {
      muteMember(groupId, memberId);
      toast.success("Member muted");
    }
  }, [groupId]);

  const handleCreateTopic = useCallback(() => {
    if (!groupId || !userId || !newTopicTitle.trim()) return;
    createTopic(groupId, newTopicTitle.trim(), newTopicIcon, newTopicColor, userId);
    setTopics(getTopics(groupId));
    setNewTopicTitle("");
    setShowTopicCreator(false);
    toast.success("Topic created");
  }, [groupId, userId, newTopicTitle, newTopicIcon, newTopicColor]);

  const handleDeleteTopic = useCallback((topicId: string) => {
    deleteTopic(topicId);
    if (groupId) setTopics(getTopics(groupId));
    if (selectedTopic?.id === topicId) {
      setSelectedTopic(null);
      setTopicMessages([]);
    }
    toast.success("Topic deleted");
  }, [groupId, selectedTopic]);

  const handleSelectTopic = useCallback((topic: Topic) => {
    setSelectedTopic(topic);
    setTopicMessages(getTopicMessages(topic.id));
  }, []);

  const handleSendTopicMessage = useCallback(() => {
    if (!selectedTopic || !groupId || !userId || !newTopicMessage.trim()) return;
    addTopicMessage(selectedTopic.id, groupId, userId, newTopicMessage.trim());
    setTopicMessages(getTopicMessages(selectedTopic.id));
    setNewTopicMessage("");
    if (groupId) setTopics(getTopics(groupId));
  }, [selectedTopic, groupId, userId, newTopicMessage]);

  const handleTogglePinTopic = useCallback((topicId: string) => {
    togglePinTopic(topicId);
    if (groupId) setTopics(getTopics(groupId));
  }, [groupId]);

  const getSenderName = (senderId: string): string => {
    const profile = memberProfiles.get(senderId);
    return profile?.name || profile?.username || "Unknown";
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">Group not found</p>
        <Button onClick={() => navigate('/chats')}>Back to Chats</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center space-x-3 flex-1 cursor-pointer">
                <ChatAvatar 
                  name={group.name} 
                  src={group.avatar_url || undefined}
                  size="md" 
                />
                <div>
                  <h2 className="font-semibold text-foreground">{group.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Group Info</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-col items-center space-y-2">
                  <ChatAvatar name={group.name} src={group.avatar_url || undefined} size="lg" />
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground text-center">{group.description}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members ({members.length})
                  </h4>
                  <div className="space-y-1">
                    {members.map(member => (
                      <MemberItem
                        key={member.id}
                        member={member}
                        isAdmin={member.role === 'admin'}
                        canRemove={userIsAdmin && member.user_id !== userId}
                        onRemove={() => handleRemoveMember(member.user_id)}
                      />
                    ))}
                  </div>
                </div>

                {userIsAdmin && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Topics ({topics.length})
                      </h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowTopicCreator(true)} data-testid="button-create-topic-sheet">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    {topics.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No topics yet</p>
                    ) : (
                      <div className="space-y-1">
                        {topics.map(topic => (
                          <div key={topic.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3" style={{ color: topic.color }} />
                              <span className="text-sm">{topic.title}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">{topic.messageCount}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(topic.id)} data-testid={`button-delete-topic-${topic.id}`}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLeaveGroup}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Group
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userIsAdmin && (
                <DropdownMenuItem onClick={() => navigate(`/group/${groupId}/add-members`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </DropdownMenuItem>
              )}
              {userIsAdmin && (
                <DropdownMenuItem onClick={() => setShowAdminPanel(true)} data-testid="menu-admin-panel">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {slowModeInterval > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-1 bg-muted/50 border-b border-border">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Slow mode: {getSlowModeLabel(slowModeInterval)}</span>
          {slowModeCooldown > 0 && (
            <span className="text-xs font-medium text-foreground ml-1">({slowModeCooldown}s)</span>
          )}
        </div>
      )}

      {topics.length > 0 && !selectedTopic && (
        <div className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Topics</span>
            {userIsAdmin && (
              <Button variant="ghost" size="icon" onClick={() => setShowTopicCreator(true)} data-testid="button-add-topic">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => handleSelectTopic(topic)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm whitespace-nowrap hover-elevate"
                style={{ borderLeft: `3px solid ${topic.color}` }}
                data-testid={`button-topic-${topic.id}`}
              >
                <Hash className="h-3 w-3" style={{ color: topic.color }} />
                <span className="text-foreground">{topic.title}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{topic.messageCount}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTopic && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedTopic(null); setTopicMessages([]); }} data-testid="button-back-from-topic">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Hash className="h-4 w-4" style={{ color: selectedTopic.color }} />
          <span className="text-sm font-medium text-foreground">{selectedTopic.title}</span>
          <div className="flex-1" />
          {userIsAdmin && (
            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(selectedTopic.id)} data-testid="button-delete-topic">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {selectedTopic ? (
          topicMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No messages in this topic yet</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-4 py-2 space-y-2">
              {topicMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.senderId === userId
                      ? "bg-chat-bubble-outgoing text-chat-text-outgoing"
                      : "bg-chat-bubble-incoming text-chat-text-incoming"
                  }`}>
                    {msg.senderId !== userId && (
                      <p className="text-xs font-medium mb-1" style={{ color: selectedTopic.color }}>{getSenderName(msg.senderId)}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 text-right mt-1">{format(new Date(msg.createdAt), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          messages.length === 0 ? (
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
                <div className="px-4 py-1">
                  <GroupMessageBubble
                    message={message}
                    isOwn={message.sender_id === userId}
                    senderName={getSenderName(message.sender_id)}
                  />
                </div>
              )}
              followOutput="smooth"
              initialTopMostItemIndex={messages.length - 1}
              alignToBottom
            />
          )
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-background border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={selectedTopic ? `Message #${selectedTopic.title}...` : "Type a message..."}
            value={selectedTopic ? newTopicMessage : newMessage}
            onChange={(e) => selectedTopic ? setNewTopicMessage(e.target.value) : setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                selectedTopic ? handleSendTopicMessage() : handleSend();
              }
            }}
            className="flex-1 bg-muted border-0 rounded-full"
            disabled={sending || (slowModeCooldown > 0 && !selectedTopic)}
          />
          <Button
            size="icon"
            onClick={selectedTopic ? handleSendTopicMessage : handleSend}
            disabled={selectedTopic ? !newTopicMessage.trim() : (!newMessage.trim() || sending || slowModeCooldown > 0)}
            className="rounded-full bg-gradient-primary hover:opacity-90"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        {slowModeCooldown > 0 && !selectedTopic && (
          <p className="text-xs text-muted-foreground text-center mt-1">Wait {slowModeCooldown}s before sending</p>
        )}
      </div>

      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" data-testid="dialog-admin-panel">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </DialogTitle>
            <DialogDescription>Manage group settings and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Slow Mode</h4>
              <div className="flex flex-wrap gap-1">
                {SLOW_MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSetSlowMode(opt.value)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      slowModeInterval === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    data-testid={`button-slowmode-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {permissions && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Permissions</h4>
                <div className="space-y-2">
                  {[
                    { key: "canSendMessages" as const, label: "Members can send messages" },
                    { key: "canSendMedia" as const, label: "Members can send media" },
                    { key: "canAddMembers" as const, label: "Members can add others" },
                    { key: "canPinMessages" as const, label: "Members can pin messages" },
                    { key: "canChangeInfo" as const, label: "Members can change group info" },
                  ].map(perm => (
                    <div key={perm.key} className="flex items-center justify-between">
                      <Label className="text-sm">{perm.label}</Label>
                      <Switch
                        checked={permissions[perm.key] as boolean}
                        onCheckedChange={(v) => handleTogglePermission(perm.key, v)}
                        data-testid={`switch-perm-${perm.key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Members</h4>
              <div className="space-y-2">
                {members.filter(m => m.user_id !== userId).map(member => {
                  const profile = memberProfiles.get(member.user_id);
                  const muted = groupId ? isMemberMuted(groupId, member.user_id) : false;
                  return (
                    <div key={member.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <ChatAvatar name={profile?.name || "User"} src={profile?.avatar_url} size="sm" />
                        <span className="text-sm">{profile?.name || profile?.username || "User"}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMuteMember(member.user_id)}
                        data-testid={`button-mute-member-${member.user_id}`}
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTopicCreator} onOpenChange={setShowTopicCreator}>
        <DialogContent data-testid="dialog-create-topic">
          <DialogHeader>
            <DialogTitle>Create Topic</DialogTitle>
            <DialogDescription>Add a discussion topic to this group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Topic name</Label>
              <Input
                placeholder="e.g., General, Announcements"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                data-testid="input-topic-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTopicColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${newTopicColor === color ? "ring-2 ring-offset-2 ring-offset-background" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    data-testid={`button-topic-color`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopicCreator(false)}>Cancel</Button>
            <Button onClick={handleCreateTopic} disabled={!newTopicTitle.trim()} data-testid="button-create-topic">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChat;
