import { useState, useEffect, useCallback, useMemo } from "react";
import { chatStore, Chat, Message, PublicProfile } from "@/lib/chatStore";
import { supabase } from "@/integrations/supabase/client";

// =============================================
// MAIN INIT HOOK
// =============================================

export function useChatStoreInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeFromSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log("[useChatStore] Found session, initializing for:", session.user.id);
          await chatStore.initialize(session.user.id);
          if (mounted) {
            setIsInitialized(true);
            setError(null);
          }
        } else {
          console.log("[useChatStore] No session found");
          if (mounted) {
            setIsInitialized(true);
          }
        }
      } catch (err) {
        console.error("[useChatStore] Init error:", err);
        if (mounted) {
          setError("Failed to initialize");
          setIsInitialized(true);
        }
      }
    };

    initializeFromSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useChatStore] Auth state change:", event);
        
        if (!mounted) return;

        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          try {
            await chatStore.initialize(session.user.id);
            if (mounted) {
              setIsInitialized(true);
              setError(null);
            }
          } catch (err) {
            console.error("[useChatStore] Re-init error:", err);
          }
        } else if (event === "SIGNED_OUT") {
          chatStore.cleanup();
          if (mounted) {
            setIsInitialized(true);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isInitialized, error, isReady: isInitialized };
}

// =============================================
// CHAT LIST HOOK
// =============================================

export function useChatList() {
  const [chats, setChats] = useState<Chat[]>(chatStore.getChatList());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = chatStore.subscribeChatList((newChats) => {
      setChats(newChats);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const totalUnread = useMemo(() => {
    const userId = chatStore.getCurrentUserId();
    return chats.reduce((sum, chat) => {
      if (chat.participant_1 === userId) {
        return sum + (chat.unread_count_1 || 0);
      }
      return sum + (chat.unread_count_2 || 0);
    }, 0);
  }, [chats]);

  return { chats, loading, totalUnread };
}

// =============================================
// CHAT INFO HOOK
// =============================================

export function useChatInfo(chatId: string | undefined) {
  const [chat, setChat] = useState<Chat | undefined>(
    chatId ? chatStore.getChat(chatId) : undefined
  );
  const [loading, setLoading] = useState(!chat);

  useEffect(() => {
    if (!chatId) return;

    const cached = chatStore.getChat(chatId);
    if (cached) {
      setChat(cached);
      setLoading(false);
    }

    const unsubscribe = chatStore.subscribeChatList((chats) => {
      const found = chats.find(c => c.id === chatId);
      if (found) {
        setChat(found);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [chatId]);

  const otherUserId = useMemo(() => {
    if (!chat) return null;
    const userId = chatStore.getCurrentUserId();
    return chat.participant_1 === userId ? chat.participant_2 : chat.participant_1;
  }, [chat]);

  return { chat, otherUserId, loading };
}

// =============================================
// MESSAGES HOOK
// =============================================

export function useMessages(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Load messages and mark as read
    chatStore.loadMessages(chatId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      // Mark messages as read when opening chat
      chatStore.markAsRead(chatId);
    });

    // Subscribe to updates
    const unsubscribe = chatStore.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      // Mark as read when new messages arrive and chat is open
      chatStore.markAsRead(chatId);
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    mediaUrl?: string,
    fileName?: string
  ) => {
    if (!chatId) return false;
    try {
      const result = await chatStore.sendMessage(chatId, content, messageType, mediaUrl, fileName);
      return !!result;
    } catch (error) {
      console.error("Send message error:", error);
      return false;
    }
  }, [chatId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!chatId) return false;
    try {
      await chatStore.deleteMessage(messageId, chatId);
      return true;
    } catch (error) {
      console.error("Delete message error:", error);
      return false;
    }
  }, [chatId]);
  const markAsRead = useCallback(async () => {
    if (!chatId) return;
    await chatStore.markAsRead(chatId);
  }, [chatId]);

  return { messages, loading, sendMessage, deleteMessage, markAsRead };
}

// =============================================
// PROFILE HOOK
// =============================================

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(
    userId ? chatStore.getCachedProfile(userId) || null : null
  );
  const [loading, setLoading] = useState(!profile && !!userId);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const cached = chatStore.getCachedProfile(userId);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    chatStore.getProfile(userId).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [userId]);

  return { profile, loading };
}

// =============================================
// TYPING INDICATOR HOOK
// =============================================

export function useTypingIndicator(chatId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = chatStore.subscribeToTyping(chatId, (users) => {
      setTypingUsers(users);
    });

    return unsubscribe;
  }, [chatId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!chatId) return;
    chatStore.setTyping(chatId, isTyping);
  }, [chatId]);

  return { typingUsers, setTyping };
}

// =============================================
// FORCE REFRESH
// =============================================

export function useForceRefresh() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await chatStore.forceRefresh();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refresh, refreshing };
}
