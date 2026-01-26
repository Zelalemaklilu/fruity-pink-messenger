import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, MoreVertical, Send, Loader2, Users, UserPlus, LogOut } from "lucide-react";
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

// Message display component
interface GroupMessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  senderName: string;
  onDelete?: () => void;
}

const GroupMessageBubble = ({ message, isOwn, senderName, onDelete }: GroupMessageBubbleProps) => {
  const timestamp = format(new Date(message.created_at), 'h:mm a');

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
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !groupId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sent = await sendGroupMessage(groupId, content);
      if (!sent) {
        toast.error('Failed to send message');
      }
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {messages.length === 0 ? (
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
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-background border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-muted border-0 rounded-full"
            disabled={sending}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="rounded-full bg-gradient-primary hover:opacity-90"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
